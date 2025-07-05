# Nomalos Project

Nomalos is a web application that features a Next.js frontend and a Node.js backend. This project serves as a platform for users to engage with the Nomalos game, allowing them to register, log in, and participate in game sessions.

## Project Structure

```
nomalos/
├── client/               # Next.js frontend
│   └── pages/
│       ├── index.tsx     # Main entry point for the application
│       ├── game/[id].tsx  # Dynamic route for game details
│       ├── login.tsx     # User login page
│       └── register.tsx  # User registration page
├── server/               # Node.js backend
│   ├── index.ts          # Main API + socket server
│   ├── db/               # Database connection + queries
│   ├── routes/           # Express routes
│   ├── gameLogic/        # Nomalos rules + validation
│   └── utils/
│       └── encoder.js    # 85-byte compressor/decompressor
├── prisma/ or sql/       # DB schema if using Prisma or raw SQL
└── README.md             # Project documentation
```

## Getting Started

To get started with the Nomalos project, follow these steps:

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd nomalos
   ```

2. **Install dependencies**:
   - For the client:
     ```
     cd client
     npm install
     ```
   - For the server:
     ```
     cd server
     npm install
     ```

3. **Set up the database**:
   - If using Prisma, run:
     ```
     npx prisma migrate dev
     ```
   - If using raw SQL, ensure your SQL files are executed to set up the database schema.

4. **Run the application**:
   - Start the server:
     ```
     cd server
     node index.ts
     ```
   - Start the client:
     ```
     cd client
     npm run dev
     ```

## Usage

- Navigate to `http://localhost:3000` to access the application.
- Use the login page to authenticate or the registration page to create a new account.
- Access game details through the dynamic game route by appending the game ID to the URL.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.