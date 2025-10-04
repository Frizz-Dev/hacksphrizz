"""
Automated Form Filling Script for Bot Behavior Data Collection
This script simulates bot-like behavior by filling forms instantly/very fast
to collect training data for the Isolation Forest model.

Requirements:
    pip install selenium webdriver-manager selenium-stealth

IMPORTANT: You need to login manually first, then the script will reuse the session.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium_stealth import stealth
import time
import random

# Configuration
BASE_URL = "http://localhost:3000"
FORM_URL = f"{BASE_URL}/book?train=eca50ef6-3037-4396-960e-46643dbec373&date=2025-20-10"
LOGIN_URL = f"{BASE_URL}/login"
NUM_ITERATIONS = 30

# Test user credentials (create a test account first)
EMAIL = "bot@test.com"
PASSWORD = "testpassword123"


def setup_driver():
    """Setup Chrome driver with stealth mode"""
    options = Options()
    options.add_argument("--start-maximized")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    # Create driver
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

    # Apply stealth settings
    stealth(driver,
        languages=["en-US", "en"],
        vendor="Google Inc.",
        platform="Win32",
        webgl_vendor="Intel Inc.",
        renderer="Intel Iris OpenGL Engine",
        fix_hairline=True,
    )

    return driver


def manual_login_prompt(driver):
    """Prompt user to login manually to avoid detection"""
    print("\n" + "="*60)
    print("MANUAL LOGIN REQUIRED")
    print("="*60)
    print(f"\n1. The browser will open to: {LOGIN_URL}")
    print(f"2. Please login manually with:")
    print(f"   Email: {EMAIL}")
    print(f"   Password: {PASSWORD}")
    print(f"3. After successful login, you'll be redirected.")
    print(f"4. Press ENTER here once you're logged in...")
    print("="*60 + "\n")

    driver.get(LOGIN_URL)
    input("Press ENTER after you've logged in successfully: ")
    print("\n✓ Proceeding with automated sessions...\n")
    return True


def fill_passenger_details_instantly(driver):
    """Page 1: Fill passenger details instantly (bot-like behavior)"""
    print("Filling passenger details (Page 1)...")

    try:
        # Wait for KTP input
        ktp_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder*='KTP']"))
        )

        # Generate random KTP number
        ktp_number = ''.join([str(random.randint(0, 9)) for _ in range(16)])

        # Fill KTP instantly (no typing delay - bot behavior)
        ktp_input.clear()
        ktp_input.send_keys(ktp_number)

        # Fill name instantly
        name_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder*='name']")
        name_input.clear()
        name_input.send_keys(f"BotUser{random.randint(1000, 9999)}")

        # No hesitation - click continue immediately
        continue_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Continue')]")
        continue_button.click()

        print("✓ Page 1 completed instantly")
        time.sleep(0.5)  # Minimal delay

    except Exception as e:
        print(f"Error on Page 1: {e}")
        raise


def select_seat_instantly(driver):
    """Page 2: Select seat instantly (bot-like behavior)"""
    print("Selecting seat (Page 2)...")

    try:
        # Wait for seat buttons to be present
        time.sleep(1)  # Wait for page to fully render

        # Find the first available "C" seat button (bg-gray-200 means available)
        seat_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(@class, 'w-10') and contains(@class, 'h-10') and contains(@class, 'bg-gray-200') and text()='C']"))
        )

        # Click the first C seat instantly (no hover/hesitation)
        seat_button.click()
        print(f"✓ Seat C selected instantly")
        time.sleep(0.3)  # Brief delay after click

        # Click continue button
        continue_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Continue') or contains(text(), 'Protection')]"))
        )
        continue_button.click()

        print("✓ Page 2 completed instantly")
        time.sleep(0.5)

    except Exception as e:
        print(f"Error on Page 2: {e}")
        # Take screenshot for debugging
        driver.save_screenshot(f"error_seat_selection_{int(time.time())}.png")
        raise


def skip_protection_instantly(driver):
    """Page 3: Skip protection options instantly (bot-like behavior)"""
    print("Skipping protection (Page 3)...")

    try:
        # Wait for continue button
        continue_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Continue')]"))
        )

        # Click continue instantly without selecting anything
        continue_button.click()

        print("✓ Page 3 completed instantly")
        time.sleep(0.5)

    except Exception as e:
        print(f"Error on Page 3: {e}")
        raise


def skip_extras_and_submit(driver):
    """Page 4: Skip extras and submit instantly (bot-like behavior)"""
    print("Skipping extras and submitting (Page 4)...")

    try:
        # Wait for continue button
        continue_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Continue')]"))
        )

        # Click continue instantly without selecting anything
        continue_button.click()

        print("✓ Page 4 completed - Data should be saved!")
        time.sleep(1)

    except Exception as e:
        print(f"Error on Page 4: {e}")
        raise


def handle_alert(driver):
    """Handle any alert that appears"""
    try:
        alert = driver.switch_to.alert
        alert_text = alert.text
        print(f"⚠️  Alert detected: {alert_text}")
        alert.accept()
        return True
    except:
        return False


def run_bot_session(driver, iteration):
    """Run a complete bot session through all 4 pages"""
    print(f"\n{'='*60}")
    print(f"BOT SESSION #{iteration + 1}/{NUM_ITERATIONS}")
    print(f"{'='*60}")

    try:
        # Navigate to form
        driver.get(FORM_URL)
        time.sleep(1)

        # Fill all pages instantly
        fill_passenger_details_instantly(driver)
        handle_alert(driver)  # Handle any alerts

        select_seat_instantly(driver)
        handle_alert(driver)  # Handle any alerts

        skip_protection_instantly(driver)
        handle_alert(driver)  # Handle any alerts

        skip_extras_and_submit(driver)
        handle_alert(driver)  # Handle any alerts

        print(f"✅ Bot session #{iteration + 1} completed successfully!")

        # Small delay before next iteration
        time.sleep(2)

    except Exception as e:
        print(f"❌ Bot session #{iteration + 1} failed: {e}")
        # Try to handle any lingering alerts
        handle_alert(driver)
        # Take screenshot for debugging
        driver.save_screenshot(f"error_iteration_{iteration + 1}.png")


def main():
    """Main execution function"""
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║   Bot Behavior Data Collection Script                     ║
    ║   Purpose: Collect bot-like training data                 ║
    ║   Iterations: 30                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    """)

    driver = setup_driver()

    try:
        # Manual login to avoid bot detection
        if not manual_login_prompt(driver):
            print("Login cancelled.")
            return

        # Run 30 bot sessions
        for i in range(NUM_ITERATIONS):
            run_bot_session(driver, i)

        print(f"\n{'='*60}")
        print(f"✅ ALL {NUM_ITERATIONS} BOT SESSIONS COMPLETED!")
        print(f"{'='*60}")
        print("\nCheck your Supabase 'raw_train_data' table for the collected data.")

    except KeyboardInterrupt:
        print("\n\n⚠️  Script interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("\nClosing browser...")
        driver.quit()


if __name__ == "__main__":
    main()
