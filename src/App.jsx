import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [title,setTitle] = useState(" ");
  const [content,setContent] = useState(" ");
  const[notes,setNotes]=useState([]);
  function submit(){
    const newNote={
    title:title,
    content:content
    };
    setNotes([...notes,newNote]);
  }

  return (
    <div>
    <input 
    placeholder="title"
    value={title}
    onChange={(e)=>setTitle(e.target.value)}
    />
    <textarea 
    placeholder="content"
    value={content}
    onChange={(e)=>setContent(e.target.value)}
    ></textarea>
    <button onClick={submit}>add note</button>

    {notes.map((note)=>(
      <div>
        <h2>{note.title}</h2>
        <p>{note.content}</p>
      </div>
    ))}
    </div>
  )
}

export default App
