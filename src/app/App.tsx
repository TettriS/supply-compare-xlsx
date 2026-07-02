import reactLogo from '/src/assets/react.svg'
import viteLogo from '/src/assets/vite.svg'
import heroImg from '/src/assets/hero.png'
import './App.css'
import Parser from '../pages/Parser'
// import ViteMarkdown from '../modules/viteDefault'

function App() {
  return (
    <>
      <section id="center" style={{ padding: '10% 0' }}>
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <Parser />
      </section>
      {/* <ViteMarkdown /> */}
    </>
  )
}

export default App
