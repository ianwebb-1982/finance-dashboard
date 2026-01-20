import os
import requests
from dotenv import load_dotenv
from supabase import create_client

print("1. Loading .env file...")
load_dotenv()

# --- CONFIG ---
CLIENT_ID = os.getenv("TRUELAYER_CLIENT_ID")
CLIENT_SECRET = os.getenv("TRUELAYER_CLIENT_SECRET")
REDIRECT_URI = "https://console.truelayer.com/redirect-page"

# Determine if using sandbox or live
USE_SANDBOX = os.getenv("TRUELAYER_USE_SANDBOX", "false").lower() == "true"

if USE_SANDBOX:
    AUTH_URL = "https://auth.truelayer-sandbox.com/connect/token"
    API_URL = "https://api.truelayer-sandbox.com/data/v1"
    print("   Using SANDBOX environment")
else:
    AUTH_URL = "https://auth.truelayer.com/connect/token"
    API_URL = "https://api.truelayer.com/data/v1"
    print("   Using LIVE environment")

# Get fresh auth code (you'll update this each time)
AUTH_CODE = os.getenv("TRUELAYER_AUTH_CODE", "")

if not AUTH_CODE:
    print("❌ ERROR: No TRUELAYER_AUTH_CODE found in .env file!")
    print("Please add it to your .env file or run the auth flow first.")
    exit(1)

print("2. Initializing Supabase client...")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Missing Supabase credentials in .env!")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def simple_categorize(description):
    """Simple rule-based categorization (no AI needed for now)"""
    desc_lower = description.lower()
    
    # Grocery stores
    if any(word in desc_lower for word in ['tesco', 'asda', 'sainsbury', 'morrisons', 'aldi', 'lidl', 'waitrose', 'co-op']):
        return 'Groceries'
    
    # Transport
    if any(word in desc_lower for word in ['uber', 'lyft', 'train', 'bus', 'tfl', 'transport', 'parking', 'petrol', 'shell', 'bp', 'esso']):
        return 'Transport'
    
    # Bills & Utilities
    if any(word in desc_lower for word in ['bill', 'electric', 'gas', 'water', 'council tax', 'internet', 'phone', 'vodafone', 'ee', 'three', 'o2']):
        return 'Bills'
    
    # Entertainment
    if any(word in desc_lower for word in ['netflix', 'spotify', 'amazon prime', 'disney', 'cinema', 'theatre', 'gym']):
        return 'Entertainment'
    
    # Dining
    if any(word in desc_lower for word in ['restaurant', 'cafe', 'coffee', 'starbucks', 'costa', 'mcdonald', 'kfc', 'pizza', 'deliveroo', 'uber eats', 'just eat']):
        return 'Dining'
    
    # Shopping
    if any(word in desc_lower for word in ['amazon', 'ebay', 'shop', 'store', 'retail', 'argos', 'currys', 'john lewis']):
        return 'Shopping'
    
    # Default
    return 'Unclear'

def start_sync():
    print(f"3. Attempting to exchange authorization code...")
    
    token_payload = {
        "grant_type": "authorization_code", 
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET, 
        "redirect_uri": REDIRECT_URI, 
        "code": AUTH_CODE
    }
    
    try:
        # Get Access Token
        print(f"4. Requesting access token from TrueLayer ({AUTH_URL})...")
        res = requests.post(AUTH_URL, data=token_payload, timeout=10)
        
        if res.status_code != 200:
            print(f"❌ Token Error ({res.status_code}): {res.json()}")
            print("\n💡 TIP: Your authorization code may have expired.")
            print("   Auth codes only last 10 minutes!")
            print("   Generate a new one and update TRUELAYER_AUTH_CODE in your .env file.")
            return
        
        token_data = res.json()
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        
        print(f"   ✅ Access token received")
        print(f"   ✅ Refresh token: {'Yes' if refresh_token else 'No'}")
        
        if not access_token:
            print(f"❌ No access token in response: {token_data}")
            return

        # Get Bank Accounts
        print(f"5. Fetching bank accounts from {API_URL}/accounts...")
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        acc_res = requests.get(f"{API_URL}/accounts", headers=headers, timeout=10)
        
        print(f"   Response status: {acc_res.status_code}")
        
        if acc_res.status_code != 200:
            print(f"❌ Accounts Error ({acc_res.status_code}): {acc_res.json()}")
            print("\n💡 DEBUGGING INFO:")
            print(f"   - Client ID starts with: {CLIENT_ID[:20]}...")
            print(f"   - Using environment: {'SANDBOX' if USE_SANDBOX else 'LIVE'}")
            print(f"   - API URL: {API_URL}")
            return
        
        accounts = acc_res.json().get('results', [])
        
        if not accounts:
            print("❌ No accounts found!")
            print("   This might mean:")
            print("   - The bank connection wasn't successful")
            print("   - Your consent has expired")
            print("   - You need to re-authorize")
            return
        
        print(f"   Found {len(accounts)} account(s)")
        for i, acc in enumerate(accounts, 1):
            print(f"   [{i}] {acc.get('display_name', 'Unknown')} - {acc.get('account_type', 'Unknown')}")
        
        # Get Transactions from first account
        account_id = accounts[0]['account_id']
        print(f"\n6. Fetching transactions for account: {account_id[:20]}...")
        
        trans_res = requests.get(
            f"{API_URL}/accounts/{account_id}/transactions",
            headers=headers,
            timeout=10
        )
        
        print(f"   Response status: {trans_res.status_code}")
        
        if trans_res.status_code != 200:
            print(f"❌ Transactions Error ({trans_res.status_code}): {trans_res.json()}")
            print("\n💡 This might mean:")
            print("   - The access token doesn't have 'transactions' scope")
            print("   - Your bank consent doesn't include transaction access")
            print("   - The consent has expired (usually 90 days)")
            print("\n   Try generating a NEW auth code with 'transactions' scope selected")
            return
        
        transactions = trans_res.json().get("results", [])
        print(f"   Found {len(transactions)} transaction(s)")

        if not transactions:
            print("⚠️ No transactions found for this account.")
            print("   This is normal if:")
            print("   - The account is new")
            print("   - There are no recent transactions")
            print("   - The bank only shares recent data")
            return

        print(f"\n7. Syncing {len(transactions)} transactions to Supabase...")
        
        success_count = 0
        for i, t in enumerate(transactions, 1):
            try:
                is_income = t['amount'] > 0
                category = "Income" if is_income else simple_categorize(t['description'])
                
                payload = {
                    "truelayer_id": t['transaction_id'],
                    "amount": abs(t['amount']),
                    "description": t['description'],
                    "merchant_name": t.get('merchant_name', ''),
                    "category": category,
                    "date": t['timestamp'][:10],
                    "is_income": is_income,
                    "currency": t.get('currency', 'GBP')
                }
                
                result = supabase.table("transactions").upsert(
                    payload, 
                    on_conflict="truelayer_id"
                ).execute()
                
                success_count += 1
                print(f"   [{i}/{len(transactions)}] ✅ {t['description'][:40]:<40} -> {category}")
                
            except Exception as e:
                print(f"   [{i}/{len(transactions)}] ❌ Error saving transaction: {e}")

        print(f"\n🎉 SUCCESS! Synced {success_count}/{len(transactions)} transactions to Supabase.")
        print("   Refresh your dashboard to see the data!")
        
        if refresh_token:
            print(f"\n💾 SAVE THIS REFRESH TOKEN for future use:")
            print(f"   {refresh_token}")
            print("   Add it to your .env as TRUELAYER_REFRESH_TOKEN")

    except requests.exceptions.Timeout:
        print("❌ Request timed out. Check your internet connection.")
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("TrueLayer → Supabase Sync Script")
    print("=" * 60)
    start_sync()