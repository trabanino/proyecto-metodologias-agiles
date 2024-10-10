from pathlib import Path
from tkinter import Tk, Canvas, Entry, Button, PhotoImage
from controllers.register_logic import handle_register

OUTPUT_PATH = Path(__file__).parent
ASSETS_PATH = OUTPUT_PATH / Path(r"../assets/register")

def relative_to_assets(path: str) -> Path:
    return ASSETS_PATH / Path(path)

def open_register_gui():
    window = Tk()
    window.withdraw()
    window.geometry("900x600")
    window.configure(bg="#FFFFFF")
    window.title("Registro")

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
    canvas.create_rectangle(
        0.0,
        0.0,
        345.0,
        600.0,
        fill="#2C2C2C",
        outline=""
    )

    canvas.create_text(
        47.0,
        258.0,
        anchor="nw",
        text="¡Regístrate!",
        fill="#FFFFFF",
        font=("SFProDisplay Bold", 26 * -1)
    )

    canvas.create_text(
        444.0,
        50.0,
        anchor="nw",
        text="Crear una nueva cuenta",
        fill="#000000",
        font=("SFProDisplay Bold", 26 * -1)
    )

    # Nombre de usuario
    entry_image_1 = PhotoImage(file=relative_to_assets("entry_1.png"))
    canvas.create_image(542.0, 140.0, image=entry_image_1)
    entry_usuario = Entry(
        bd=0,
        bg="#D9D9D9",
        fg="#000716",
        highlightthickness=0
    )
    entry_usuario.place(x=420.0, y=120.0, width=244.0, height=40.0)
    canvas.create_text(
        417.0,
        100.0,
        anchor="nw",
        text="Usuario",
        fill="#000000",
        font=("SFProDisplay Regular", 15 * -1)
    )

    # Contraseña
    entry_image_2 = PhotoImage(file=relative_to_assets("entry_2.png"))
    canvas.create_image(542.0, 220.0, image=entry_image_2)
    entry_contraseña = Entry(
        bd=0,
        bg="#D9D9D9",
        fg="#000716",
        highlightthickness=0,
        show="*"
    )
    entry_contraseña.place(x=420.0, y=200.0, width=244.0, height=40.0)
    canvas.create_text(
        417.0,
        180.0,
        anchor="nw",
        text="Contraseña",
        fill="#000000",
        font=("SFProDisplay Regular", 15 * -1)
    )

    # Confirmar Contraseña
    entry_image_3 = PhotoImage(file=relative_to_assets("entry_3.png"))
    canvas.create_image(542.0, 300.0, image=entry_image_3)
    entry_confirmar_contraseña = Entry(
        bd=0,
        bg="#D9D9D9",
        fg="#000716",
        highlightthickness=0,
        show="*"
    )
    entry_confirmar_contraseña.place(x=420.0, y=280.0, width=244.0, height=40.0)
    canvas.create_text(
        417.0,
        260.0,
        anchor="nw",
        text="Confirmar Contraseña",
        fill="#000000",
        font=("SFProDisplay Regular", 15 * -1)
    )

    # Email
    entry_image_4 = PhotoImage(file=relative_to_assets("entry_4.png"))
    canvas.create_image(542.0, 380.0, image=entry_image_4)
    entry_email = Entry(
        bd=0,
        bg="#D9D9D9",
        fg="#000716",
        highlightthickness=0
    )
    entry_email.place(x=420.0, y=360.0, width=244.0, height=40.0)
    canvas.create_text(
        417.0,
        340.0,
        anchor="nw",
        text="Email",
        fill="#000000",
        font=("SFProDisplay Regular", 15 * -1)
    )

    # Registro
    button_image_1 = PhotoImage(file=relative_to_assets("button_1.png"))
    button_1 = Button(
        image=button_image_1,
        borderwidth=0,
        highlightthickness=0,
        command=lambda: handle_register(
            entry_usuario,
            entry_contraseña,
            entry_confirmar_contraseña,
            entry_email,
            window
        ),
        relief="flat"
    )
    button_1.place(x=419.0, y=440.0, width=123.0, height=28.0)

    # Volver al login
    from views.login import open_login_gui
    button_image_2 = PhotoImage(file=relative_to_assets("button_2.png"))
    button_2 = Button(
        image=button_image_2,
        borderwidth=0,
        highlightthickness=0,
        command=lambda: window.destroy() or open_login_gui(),
        relief="flat"
    )
    button_2.place(
        x=715.0,
        y=527.0,
        width=123.0,
        height=28.0
    )

    window.resizable(False, False)
    window.mainloop()
