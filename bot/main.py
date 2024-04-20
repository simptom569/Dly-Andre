# 5291411818:AAGAdwQuGXnCBk_0ccJ2OoEGOY6uCYmKjI8

import asyncio
import logging
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message
from aiogram.filters import CommandStart, Command


# Установка уровня логирования
logging.basicConfig(level=logging.INFO)


API_TOKEN = '5291411818:AAGAdwQuGXnCBk_0ccJ2OoEGOY6uCYmKjI8'


# Создание объектов бота и диспетчера
bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# Словарь для хранения user_id пользователей, отправивших сообщения боту
user_ids = set()

token = "12345"
# https://t.me/Kolonayyy_bot?start=12345


# Обработка всех входящих сообщений
@dp.message()
async def handle_message(message: Message):

    # Получаем текст сообщения
    text = message.text
    # Разделяем строку по пробелу
    parts = text.split()
    # Получаем аргументы команды
    args = parts[1] if len(parts) > 1 else None
    # Проверяем наличие аргументов команды
    if args == token:
        await send_message_by_id(message.from_user.id, "Авторизация прошла успешно")
        print(token)


    print(message.from_user.username)
    print(message.from_user.id)


# Функция для отправки сообщения по username
async def send_message_by_id(id, text):
    try:
        await bot.send_message(id, text)
    except Exception as e:
        logging.exception("Ошибка при отправке сообщения пользователю:", e)


async def main():
    await dp.start_polling(bot)

if __name__ == '__main__':
    # Запуск асинхронного цикла
    asyncio.run(main())