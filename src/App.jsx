import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { useEffect } from 'react'

function App() {
  const [title,setTitle] = useState(" ");
  const [content,setContent] = useState(" ");
  const[notes,setNotes]=useState([]);
  const[editingnote,setEditNote]=useState(null);

  //user — stores the logged-in user's details. null means we haven't loaded a logged-in user yet.
  //showSignup — decides whether to show the signup form or the login form.
  const [user, setUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

/*uses state for:
- title and content — what you type into the note form.
- notes — the notes displayed on the page.
- editingnote — which note you're editing.
- user — the logged-in user's details.
- showSignup — whether to show signup or login.
- name, email, password — authentication form inputs.
*/

const [search, setSearch] = useState("");



//signup form
async function signup() {
  const response = await fetch("http://localhost:5000/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: name,
      email: email,
      password: password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.message || "Signup failed");
    return;
  }

  alert("Signup successful! Please log in.");

  setName("");
  setEmail("");
  setPassword("");
  setShowSignup(false);
}

//login form
async function login() {
  const response = await fetch("http://localhost:5000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",   //credentials: "include" allows the browser to receive and store the session cookie from the backend
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.message || "Login failed");
    return;
  }

  setUser(data.user);
  setEmail("");
  setPassword("");
  await getNotes();
}




//// Fetches the logged-in user's notes by sending the session cookie and handles authentication errors.
//encodeURIComponent(search) — safely encodes special characters in the search text for the URL.
async function getNotes(search = "") {
  const response = await fetch(
  `http://localhost:5000/notes?search=${encodeURIComponent(search)}`,
  {
    credentials: "include"
  }
);

  const data = await response.json();

  if (!response.ok) {
    console.log(data.message);
    return;
  }

  setNotes(data);
}


  // Checks whether the user is already logged in when the app opens or refreshes.
  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("http://localhost:5000/me", {
          credentials: "include"
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setUser(data.user);
        await getNotes();
      } catch (error) {
        console.error("Could not check login:", error);
      }
    }

    checkLogin();
  }, []);



 async function submit() {
    
    if (editingnote) {

       const response = await fetch(
            `http://localhost:5000/notes/${editingnote.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    title: title,
                    content: content
                })
            }
        );

        const data = await response.json();

        const updatedNotes = notes.map((note) => {
             if (note.id === editingnote.id) {
                return data;
            }

            return note;
        });

        setNotes(updatedNotes);
        setEditNote(null);
        setTitle("");
        setContent("");

    } else {
       
        const response=await fetch("http://localhost:5000/notes", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
        title: title,
        content: content
      })
    })
    const data = await response.json();

    setNotes([...notes, data]);
    setTitle("");
    setContent("");
    
}}

  async function deletenote(note){
     const response = await fetch(
    `http://localhost:5000/notes/${note.id}`,
    {
      method: "DELETE",
      credentials: "include",

    }
  );

  const data = await response.json();
    
    const updatednotes= notes.filter((n)=>n!==note);
    setNotes(updatednotes);
  }

  function editnote(note){
    setTitle(note.title);
    setContent(note.content);
    setEditNote(note);
  }


async function logout() {
  const response = await fetch("http://localhost:5000/logout", {
    method: "POST",
    credentials: "include"
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.message || "Logout failed");
    return;
  }

  setUser(null);
  setNotes([]);
  setEditNote(null);
  setTitle("");
  setContent("");
}


  
return (
  <div>
    <h1>Developer Second Brain</h1>

    {!user ? (
      <div className="auth-form">
        <h2>{showSignup ? "Sign Up" : "Login"}</h2>

        {showSignup && (
          <>
            <label>Name</label>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </>
        )}

        <label>Email</label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={showSignup ? signup : login}>
          {showSignup ? "Sign Up" : "Login"}
        </button>

        <p>
          {showSignup
            ? "Already have an account?"
            : "Don't have an account?"}

          <button onClick={() => setShowSignup(!showSignup)}>
            {showSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    ) : (
      <div>
        <h2>Welcome, {user.name}!</h2>
        <button onClick={logout}>Logout</button>

        <input
        placeholder="Search your notes"
        value={search}
        onChange={(e) => {
        const value = e.target.value;
        setSearch(value);
        getNotes(value);
         }}
        />

        <div className="note-form">
          <label>Title</label>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label>Content</label>
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button onClick={submit}>
            {editingnote ? "Save Edit" : "Add Note"}
          </button>
        </div>

        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <h2>{note.title}</h2>
            <p>{note.content}</p>
            <button
              className="edit-btn"
              onClick={() => deletenote(note)}
            >
              Delete Note
            </button>
            <button
              className="delete-btn"
              onClick={() => editnote(note)}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

}

export default App
