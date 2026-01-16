import os
import requests
from dotenv import load_dotenv
from supabase import create_client
from google import genai

print("1. Loading .env file...")
load_dotenv()

# --- CONFIG ---
CLIENT_ID = os.getenv("TRUELAYER_CLIENT_ID")
CLIENT_SECRET = os.getenv("TRUELAYER_CLIENT_SECRET")
REDIRECT_URI = "https://console.truelayer.com/redirect-page"
# ⚠️ REMEMBER: You need a FRESH code from get_bank_data.py
AUTH_CODE = "09354427A50E56AFC1B38E8CC1635370DD1D86420042F5E49ACA5D8B98BC6C52" 

print("2. Initializing clients...")
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_ai_category(desc):
    """Fixed AI function using the updated model alias."""
    # Use 'gemini-2.0-flash' (latest) or 'gemini-1.5-flash' (stable)
    # Note: No 'models/' prefix is needed with the Client.models.generate_content method
    model_name = "gemini-2.0-flash" 
    
    prompt = f"Categorize this UK bank transaction: '{desc}'. Reply with ONLY one word: Groceries, Transport, Bills, Entertainment, Shopping, Dining, Income."
    
    try:
        response = client.models.generate_content(
            model=model_name, 
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"      ⚠️ AI Error on '{desc}': {e}")
        return "Uncategorized"

def start_sync():
    print(f"3. Attempting to exchange code: {AUTH_CODE[:5]}...")
    
    token_payload = {
        "grant_type": "authorization_code", 
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET, 
        "redirect_uri": REDIRECT_URI, 
        "code": AUTH_CODE
    }
    
    try:
        # Get Token
        res = requests.post("https://auth.truelayer-sandbox.com/connect/token", data=token_payload, timeout=10)
        token = res.json().get("access_token")
        
        if not token:
            print(f"❌ Error: {res.json()}")
            return

        # Get Bank Data
        print("4. Token obtained! Fetching account and transactions...")
        headers = {"Authorization": f"Bearer {token}"}
        acc_res = requests.get("https://api.truelayer-sandbox.com/data/v1/accounts", headers=headers).json()
        acc_id = acc_res['results'][0]['account_id']
        
        trans_res = requests.get(f"https://api.truelayer-sandbox.com/data/v1/accounts/{acc_id}/transactions", headers=headers).json()
        transactions = trans_res.get("results", [])

        print(f"5. Found {len(transactions)} transactions. Starting Sync...")

        for t in transactions:
            is_inc = t['amount'] > 0
            # Call our newly restored function!
            cat = "Income" if is_inc else get_ai_category(t['description'])
            
            payload = {
                "truelayer_id": t['transaction_id'],
                "amount": abs(t['amount']),
                "description": t['description'],
                "category": cat,
                "date": t['timestamp'][:10],
                "is_income": is_inc
            }
            
            supabase.table("transactions").upsert(payload, on_conflict="truelayer_id").execute()
            print(f"   ✅ Saved & Categorized: {t['description']} -> {cat}")

        print("\n🎉 SUCCESS! All transactions are now in Supabase.")

    except Exception as e:
        print(f"❌ A major error occurred: {e}")

if __name__ == "__main__":
    start_sync()