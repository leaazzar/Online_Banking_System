from flask import Flask


def create_app():
    app = Flask(__name__)

    @app.get("/")
    def home():
        return {"service": "customer_api", "status": "running"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=5001, debug=True)
