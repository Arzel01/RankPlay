import sqlite3
import csv

# Conexión a la base de datos SQLite
def export_games_to_csv():
    try:
        conn = sqlite3.connect('db.sqlite3')
        cursor = conn.cursor()

        # Consulta para obtener los datos de la tabla games
        cursor.execute("SELECT * FROM games")
        rows = cursor.fetchall()

        # Obtener los nombres de las columnas
        column_names = [description[0] for description in cursor.description]

        # Exportar a un archivo CSV
        with open('games_data.csv', 'w', newline='', encoding='utf-8') as csvfile:
            csvwriter = csv.writer(csvfile)
            csvwriter.writerow(column_names)  # Escribir encabezados
            csvwriter.writerows(rows)  # Escribir datos

        print("Datos exportados a 'games_data.csv' exitosamente.")

    except sqlite3.Error as e:
        print(f"Error al conectar con la base de datos: {e}")

    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    export_games_to_csv()