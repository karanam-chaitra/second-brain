const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");

const session = require("express-session");
const app = express();
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "developer_second_brain",
  password: "Rishi@#2004",
  port: 5432
});



//configure cors - Allow the frontend to send requests with session cookies
app.use(cors({                       
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

//configure sessions
app.use(session({                  
  secret: process.env.SESSION_SECRET || "dev-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24
  }
}));

function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "User not logged in"
    });
  }

  next();
}



app.post("/notes", isAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.session.userId;

  const result = await pool.query(
    "INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3) RETURNING *",
    [title, content, userId]
  );

  res.json(result.rows[0]);
});





app.get("/notes", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const search = req.query.search || "";

  const result = await pool.query(
    `SELECT * FROM notes
     WHERE user_id = $1
     AND (
       title ILIKE $2
       OR content ILIKE $2
     )
     ORDER BY id ASC`,
    [userId, `%${search}%`]
  );

  res.json(result.rows);
});




app.put("/notes/:id", isAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.session.userId;

  const result = await pool.query(
    `UPDATE notes
     SET title = $1, content = $2
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [title, content, req.params.id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      message: "Note not found"
    });
  }

  res.json(result.rows[0]);
});

app.delete("/notes/:id", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  const result = await pool.query(
    `DELETE FROM notes
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [req.params.id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      message: "Note not found"
    });
  }

  res.json(result.rows[0]);
});



app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed" });
  }
});



app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Create a fresh session after successful login
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          message: "Login failed"
        });
      }

      // Remember which user logged in
      req.session.userId = user.id;

      // Save the session before responding
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({
            message: "Login failed"
          });
        }

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Login failed"
    });
  }
});


//for logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        message: "Logout failed"
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      message: "Logged out successfully"
    });
  });
});



//  /me lets your frontend ask the backend, “Is this browser already logged in, and if so, which user is it?”
//It does not log you in. Your /login route does that.

///me checks the existing session and returns the logged-in user's details, allowing React to restore login after refresh
app.get("/me", isAuthenticated, async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Not logged in"
    });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    res.json({
      message: "User is logged in",
      user: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not get user"
    });
  }
});


app.listen(5000, () => {
  console.log("Server running on port 5000");
});