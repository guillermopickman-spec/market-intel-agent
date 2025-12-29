import os
import resend
from typing import cast, List

def send_custom_email(to_email: str, subject: str, content: str):
    # 1. Pull the API key you just got from Resend.com
    api_key = os.getenv("RESEND_API_KEY")
    
    if not api_key:
        return "❌ Error: RESEND_API_KEY not found in environment"

    resend.api_key = api_key

    try:
        print(f"🌐 Sending email via Resend API to {to_email}...")
        
        # Resend's free 'onboarding' address ONLY sends to your own email
        # Since you signed up with guillermopickman@gmail.com, 
        # this address MUST be the recipient.
        email_params = {
            "from": "onboarding@resend.dev", 
            "to": [to_email], 
            "subject": subject,
            "text": content,
        }

        # Use the send method with the cast to satisfy Pylance [cite: 68]
        resend.Emails.send(cast(resend.Emails.SendParams, email_params))
        
        return "✅ Email enviado con éxito vía API"

    except Exception as e:
        print(f"❌ Resend API Error: {str(e)}")
        # If the 'to' address isn't your verified email, Resend will error here
        return f"❌ Error al enviar email vía API: {str(e)}"