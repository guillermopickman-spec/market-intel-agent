from playwright.sync_api import sync_playwright

def automate_login_test():
    """
    Script para automatizar el login en una web de pruebas.
    """
    with sync_playwright() as p:
        # headless=False para que veas la ventana abrirse
        browser = p.chromium.launch(headless=False) 
        context = browser.new_context()
        page = context.new_page()
        
        try:
            print("🚀 Visitando página de login...")
            page.goto("https://the-internet.herokuapp.com/login")

            # Rellenamos los campos usando sus selectores de ID (#)
            page.fill("#username", "tomsmith")
            page.fill("#password", "SuperSecretPassword!")
            
            # Hacemos clic en el botón
            page.click("button[type='submit']")

            # Esperamos a que la página cargue tras el login
            page.wait_for_load_state("networkidle")

            # Verificamos si aparece el mensaje de éxito
            # El ID #flash es donde esta web pone las notificaciones
            success_msg = page.inner_text("#flash")
            
            if "You logged into a secure area!" in success_msg:
                return "✅ Login exitoso: ¡Estamos dentro!"
            else:
                return "❌ El login falló o el mensaje cambió."

        except Exception as e:
            return f"Error en el robot: {str(e)}"
        finally:
            # Pausa de 3 segundos para que veas el resultado antes de cerrar
            page.wait_for_timeout(3000)
            browser.close()