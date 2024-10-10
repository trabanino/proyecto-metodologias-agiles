import mysql.connector

def connect():
    try:
        conn = mysql.connector.connect(
            host="esen.trabanino.xyz",
            port=3306,
            database="gestion_proyectos",
            user="app_proyectos",
            password="9=o_5fqR$RVW7E.uyS(fqfiKQgVyFMp~Y1{b-b0SQJH5t_t6^C",
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci',
            use_unicode=True
        )
        return conn
    except mysql.connector.Error as e:
        print(f"Error conectando a la base de datos: {e}")
        return None