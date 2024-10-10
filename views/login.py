from pathlib import Path
from tkinter import Tk, Canvas, Entry, Button, PhotoImage
from controllers.login_logic import handle_login
from views.register import open_register_gui

OUTPUT_PATH = Path(__file__).parent
ASSETS_PATH = OUTPUT_PATH / Path(r"../assets/login")

def relative_to_assets(path: str) -> Path:
    return ASSETS_PATH / Path(path)

def open_login_gui():
    window = Tk()
    window.withdraw()
    window.geometry("900x600")
    window.configure(bg="#FFFFFF")
    window.title("Login")

    screen_width = window.winfo_screenwidth()
    screen_height = window.winfo_screenheight()
    x = (screen_width / 2) - (900 / 2)
    y = (screen_height / 2) - (600 / 2)

    window.geometry('+%d+%d' % (x, y))

    window.deiconify()

    canvas = Canvas(
        window,
        bg="#FFFFFF",
        height=600,
        width=900,
        bd=0,
        highlightthickness=0,
        relief="ridge"
    )
    canvas.place(x=0, y=0)

    # fondo izquierdo
    canvas.create_rectangle(
        0.0,
        0.0,
        345.0,
        600.0,
        fill="#2C2C2C",
        outline=""
    )

    # texto de bienvenida
    canvas.create_text(
        47.0,
        258.0,
        anchor="nw",
        text="¡Bienvenido!",
        fill="#FFFFFF",
        font=("SFProDisplay Bold", 26 * -1)
    )

    # texto de iniciar sesion
    canvas.create_text(
        444.0,
        195.0,
        anchor="nw",
        text="Iniciar sesión",
        fill="#000000",
        font=("SFProDisplay Bold", 26 * -1)
    )

    # entrada de usuario
    entry_image_1 = PhotoImage(file=relative_to_assets("entry_1.png"))
    entry_bg_1 = canvas.create_image(542.0, 289.0, image=entry_image_1)
    entry_username = Entry(
        bd=0,
        bg="#D9D9D9",
        fg="#000716",
        highlightthickness=0
    )
    entry_username.place(x=420.0, y=268.0, width=244.0, height=40.0)

    # entrada de contraseña
    entry_image_2 = PhotoImage(file=relative_to_assets("entry_2.png"))
    entry_bg_2 = canvas.create_image(542.0, 373.0, image=entry_image_2)
    entry_password = Entry(
        bd=0,
        bg="#D9D9D9",
        fg="#000716",
        highlightthickness=0,
        show="*",
    )
    entry_password.bind("<Return>", lambda event: handle_login(entry_username, entry_password, window))
    entry_password.place(x=420.0, y=352.0, width=244.0, height=40.0)

    # nombres de los campos
    canvas.create_text(
        417.0,
        250.0,
        anchor="nw",
        text="Usuario",
        fill="#000000",
        font=("SFProDisplay Regular", 15 * -1)
    )

    canvas.create_text(
        417.0,
        334.0,
        anchor="nw",
        text="Contraseña",
        fill="#000000",
        font=("SFProDisplay Regular", 15 * -1)
    )

    # boton de iniciar sesion
    button_image_1 = PhotoImage(file=relative_to_assets("button_1.png"))
    button_login = Button(
        image=button_image_1,
        borderwidth=0,
        highlightthickness=0,
        command=lambda: handle_login(entry_username, entry_password, window),
        relief="flat"
    )
    button_login.place(
        x=419.0,
        y=426.0,
        width=123.0,
        height=28.0
    )

    # boton de registrarse
    button_image_2 = PhotoImage(file=relative_to_assets("button_2.png"))
    button_register = Button(
        image=button_image_2,
        borderwidth=0,
        highlightthickness=0,
        command=lambda: window.destroy() or open_register_gui(),
        relief="flat"
    )
    button_register.place(
        x=715.0,
        y=527.0,
        width=123.0,
        height=28.0
    )

    window.resizable(False, False)
    window.mainloop()
