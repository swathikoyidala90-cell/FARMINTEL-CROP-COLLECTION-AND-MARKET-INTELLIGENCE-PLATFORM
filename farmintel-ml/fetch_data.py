from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import pandas as pd
import time

AGMARKNET_URL = "https://agmarknet.gov.in/PriceAndArrivals/DatewiseCommodityReport.aspx"

def fetch_ap_crop_markets(crop_name: str) -> pd.DataFrame:
    options = Options()
    options.add_argument("--headless")          # run in background
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                         "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36")

    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 20)

    try:
        print(f"🔍 Opening agmarknet for '{crop_name}' in Andhra Pradesh...\n")
        driver.get(AGMARKNET_URL)
        time.sleep(3)  # let JS render

        # --- Select Commodity ---
        commodity_sel = wait.until(
            EC.presence_of_element_located((By.XPATH, "//select[contains(@id,'Commodity') or contains(@name,'Commodity')]"))
        )
        commodity_dropdown = Select(commodity_sel)

        # Find closest match
        matched = None
        for opt in commodity_dropdown.options:
            if opt.text.strip().lower() == crop_name.lower():
                matched = opt.text.strip()
                break
        if not matched:
            for opt in commodity_dropdown.options:
                if crop_name.lower() in opt.text.strip().lower():
                    matched = opt.text.strip()
                    break

        if not matched:
            available = [o.text.strip() for o in commodity_dropdown.options if o.text.strip()]
            print(f"❌ Crop '{crop_name}' not found. Available crops:")
            print("   " + ", ".join(available))
            return pd.DataFrame()

        commodity_dropdown.select_by_visible_text(matched)
        print(f"   ✅ Commodity selected: {matched}")
        time.sleep(1)

        # --- Select State: Andhra Pradesh ---
        state_sel = wait.until(
            EC.presence_of_element_located((By.XPATH, "//select[contains(@id,'State') or contains(@name,'State')]"))
        )
        state_dropdown = Select(state_sel)

        state_matched = None
        for opt in state_dropdown.options:
            if "andhra pradesh" in opt.text.strip().lower():
                state_matched = opt.text.strip()
                break

        if not state_matched:
            print("❌ 'Andhra Pradesh' not found in state dropdown.")
            return pd.DataFrame()

        state_dropdown.select_by_visible_text(state_matched)
        print(f"   ✅ State selected: {state_matched}")
        time.sleep(1)

        # --- Set today's date ---
        try:
            date_input = driver.find_element(By.XPATH,
                "//input[contains(@id,'Date') or contains(@name,'Date')]")
            from datetime import datetime
            today = datetime.now().strftime("%d-%b-%Y")
            driver.execute_script("arguments[0].value = arguments[1];", date_input, today)
            print(f"   ✅ Date set: {today}")
        except Exception:
            print("   ⚠️  Date field not found, using default")

        # --- Click Submit ---
        submit_btn = driver.find_element(By.XPATH,
            "//input[@type='submit' or @type='button'][contains(@id,'btn') or contains(@value,'Submit') or contains(@value,'Go')]")
        submit_btn.click()
        print("   ✅ Form submitted\n")
        time.sleep(4)  # wait for results to load

        # --- Extract table ---
        soup_html = driver.page_source
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(soup_html, "html.parser")

        table = None
        for t in soup.find_all("table"):
            headers = [th.get_text(strip=True) for th in t.find_all("th")]
            if any(h in headers for h in ["Market", "District", "Min Price",
                                           "Modal Price", "Commodity"]):
                table = t
                break

        if not table:
            print("❌ No results table found.")
            print("   Possible reasons:")
            print("   - No arrivals reported in AP today")
            print("   - Try a different date or crop")
            driver.save_screenshot("debug_screenshot.png")
            print("   Screenshot saved: debug_screenshot.png (open to see what page shows)")
            return pd.DataFrame()

        rows = table.find_all("tr")
        headers = [th.get_text(strip=True) for th in rows[0].find_all(["th", "td"])]
        data = []
        for row in rows[1:]:
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if cols and len(cols) == len(headers):
                data.append(cols)

        return pd.DataFrame(data, columns=headers)

    finally:
        driver.quit()


def display_market_summary(df: pd.DataFrame, crop_name: str):
    if df.empty:
        return

    modal_col    = next((c for c in df.columns if "modal" in c.lower()), None)
    market_col   = next((c for c in df.columns if "market" in c.lower()), None)
    district_col = next((c for c in df.columns if "district" in c.lower()), None)
    min_col      = next((c for c in df.columns if "min" in c.lower()), None)
    max_col      = next((c for c in df.columns if "max" in c.lower()), None)

    if modal_col:
        df[modal_col] = pd.to_numeric(df[modal_col], errors="coerce")
        df = df.dropna(subset=[modal_col])
        df = df.sort_values(modal_col, ascending=False).reset_index(drop=True)
        df.index += 1

    print(f"✅ Found {len(df)} market(s) for '{crop_name}' in Andhra Pradesh\n")
    print(f"{'#':<4} {'Market':<28} {'District':<22} {'Min ₹':<10} {'Max ₹':<10} {'Modal ₹'}")
    print("-" * 85)

    for rank, row in df.iterrows():
        market   = str(row.get(market_col,   "N/A"))[:27] if market_col   else "N/A"
        district = str(row.get(district_col, "N/A"))[:21] if district_col else "N/A"
        min_p    = f"₹{int(float(row[min_col]))}"  if min_col   and pd.notna(row.get(min_col))   else "N/A"
        max_p    = f"₹{int(float(row[max_col]))}"  if max_col   and pd.notna(row.get(max_col))   else "N/A"
        modal_p  = f"₹{int(row[modal_col])}"       if modal_col and pd.notna(row.get(modal_col)) else "N/A"
        print(f"{rank:<4} {market:<28} {district:<22} {min_p:<10} {max_p:<10} {modal_p}")

    if modal_col and not df[modal_col].isna().all():
        print()
        print(f"📊 Summary for '{crop_name}' — Andhra Pradesh:")
        print(f"   Best market  : {df.iloc[0].get(market_col,'N/A')} @ ₹{int(df.iloc[0][modal_col])}/qtl")
        print(f"   Lowest market: {df.iloc[-1].get(market_col,'N/A')} @ ₹{int(df.iloc[-1][modal_col])}/qtl")
        print(f"   State average: ₹{int(df[modal_col].mean())}/qtl")


if __name__ == "__main__":
    crop = input("Enter crop name: ").strip()
    df = fetch_ap_crop_markets(crop)
    display_market_summary(df, crop)