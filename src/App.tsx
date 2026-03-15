import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Editor from "@monaco-editor/react";
import { emmetHTML } from "emmet-monaco-es";
import logo from "./Logo.png";
type NodeType = "file" | "folder";

type FileNode = {
  id: number;
  name: string;
  type: NodeType;
  parent: number | null;
  language?: string;
  content?: string;
};

// Icons Components
const Icons = {
  Folder: ({ open }: { open?: boolean }) => (
    <svg className={`w-4 h-4 ${open ? 'text-yellow-400' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 20 20">
      {open ? (
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H2V6zm0 3v5a2 2 0 002 2h12a2 2 0 002-2V9H2z" clipRule="evenodd" />
      ) : (
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      )}
    </svg>
  ),
  File: ({ ext }: { ext?: string }) => {
    const colors: Record<string, string> = {
      html: 'text-orange-500',
      css: 'text-blue-500',
      js: 'text-yellow-400',
      ts: 'text-blue-600',
      json: 'text-green-500',
      default: 'text-slate-400'
    };
    return (
      <svg className={`w-4 h-4 ${colors[ext || 'default'] || colors.default}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  },
  Search: () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Package: () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Play: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Format: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  ),
  NewFile: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  NewFolder: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Close: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Console: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Clear: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Logo: () => (
    <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
      <path d="M12 28V12h4l6 10 6-10h4v16h-4V18l-6 10-6-10v10h-4z" fill="white" />
    </svg>
  ),
};

export default function MiniCodeEditor() {
  const editorRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* ---------------- PROJECT ---------------- */
  const [projectName, setProjectName] = useState("levelup-project");
  const [npmPackage, setNpmPackage] = useState("");

  /* ---------------- SEARCH ---------------- */
  const [search, setSearch] = useState("");

  /* ---------------- CONSOLE ---------------- */
  const [logs, setLogs] = useState<string[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(true);

  /* ---------------- FILE TREE ---------------- */
  const [nodes, setNodes] = useState<FileNode[]>([
    { id: 1, name: "src", type: "folder", parent: null },
    {
      id: 2,
      name: "index.html",
      type: "file",
      parent: 1,
      language: "html",
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LevelUp</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
<div class="icon">💻</div>
    <h1>Hello Level Up Creation</h1>
    <p>Tapez vos premières lignes de code</p>
    <button id="btn">Essaye-moi</button>
  </div>

  <script src="script.js"></script>

</body>
</html>`
    },
    { id: 3, name: "css", type: "folder", parent: 1 },
    {
      id: 4,
      name: "style.css",
      type: "file",
      parent: 3,
      language: "css",
      content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  text-align: center;
  max-width: 400px;
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h1 {
  color: #1a1a2e;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

p {
  color: #666;
  margin-bottom: 1.5rem;
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  font-size: 1rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102,126,234,0.4);
}`
    },
    { id: 5, name: "js", type: "folder", parent: 1 },
    {
      id: 6,
      name: "script.js",
      type: "file",
      parent: 5,
      language: "javascript",
      content: `document.getElementById("btn")?.addEventListener("click", () => {
  console.log("🎉 Button clicked!")
  
  const btn = document.getElementById("btn")
  btn.textContent = "Bravo! 🎊"
  btn.style.background = "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
  
  console.log("✅ Button style updated!")
})`
    }
  ]);

  /* ---------------- ACTIVE FILE ---------------- */
  const [activeFile, setActiveFile] = useState<FileNode | null>(
    nodes.find((n) => n.type === "file") || null
  );

  /* ---------------- OPEN TABS ---------------- */
  const [openTabs, setOpenTabs] = useState<FileNode[]>([]);

  const openFile = (file: FileNode) => {
    if (!openTabs.find((f) => f.id === file.id)) {
      setOpenTabs([...openTabs, file]);
    }
    setActiveFile(file);
  };

  /* ---------------- FOLDERS ---------------- */
  const [openFolders, setOpenFolders] = useState<number[]>([1]);

  const toggleFolder = (id: number) => {
    if (openFolders.includes(id)) {
      setOpenFolders(openFolders.filter((f) => f !== id));
    } else {
      setOpenFolders([...openFolders, id]);
    }
  };

  /* ---------------- AUTO SAVE ---------------- */
  useEffect(() => {
    const saved = localStorage.getItem("levelup-project");
    if (saved) {
      setNodes(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("levelup-project", JSON.stringify(nodes));
  }, [nodes]);

  /* ---------------- CREATE ---------------- */
  const createFolder = (parent: number | null) => {
    const name = prompt("Nom du dossier");
    if (!name) return;
    setNodes([
      ...nodes,
      { id: Date.now(), name, type: "folder", parent }
    ]);
  };

  const createFile = (parent: number | null) => {
    const name = prompt("Nom du fichier");
    if (!name) return;
    const ext = name.split(".").pop();
    let language = "plaintext";
    if (ext === "html") language = "html";
    if (ext === "css") language = "css";
    if (ext === "js") language = "javascript";
    if (ext === "ts") language = "typescript";
    if (ext === "json") language = "json";
    setNodes([
      ...nodes,
      { id: Date.now(), name, type: "file", parent, language, content: "" }
    ]);
  };

  /* ---------------- DELETE ---------------- */
  const deleteNode = (id: number) => {
    if (!confirm("Supprimer cet élément ?")) return;
    const ids = [id];
    nodes.forEach((n) => {
      if (n.parent === id) ids.push(n.id);
    });
    setNodes(nodes.filter((n) => !ids.includes(n.id)));
    setOpenTabs(openTabs.filter((t) => !ids.includes(t.id)));
    if (activeFile && ids.includes(activeFile.id)) {
      setActiveFile(null);
    }
  };

  /* ---------------- MOVE ---------------- */
  const [dragging, setDragging] = useState<number | null>(null);

  const moveNode = (id: number, newParent: number | null) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, parent: newParent } : n)));
  };

  /* ---------------- FORMAT ---------------- */
  const formatCode = () => {
    editorRef.current?.getAction("editor.action.formatDocument").run();
  };

  /* ---------------- PREVIEW ---------------- */
  const buildPreview = () => {
    const htmlFile = nodes.find((n) => n.name.endsWith(".html"))?.content || "";
    const cssFile = nodes.find((n) => n.name.endsWith(".css"))?.content || "";
    const jsFile = nodes.find((n) => n.name.endsWith(".js"))?.content || "";
const images = nodes
  .filter((n) => n.name.match(/\.(png|jpg|jpeg|gif|svg)$/))
  .map((n) => `<img src="${n.content}" style="max-width:200px;">`)
  .join("");
    const cdn = npmPackage
      ? `<script src="https://cdn.jsdelivr.net/npm/${npmPackage}"></script>`
      : "";

    const script = `
const log = (...args) => {
  parent.postMessage({ type: "console", args }, "*")
}
console.log = log
console.error = log
console.warn = log
try {
  ${jsFile}
} catch(e) {
  console.log("❌ Error:", e.message)
}
`;

    const doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${cdn}
  <style>${cssFile}</style>
</head>
<body>
  ${htmlFile}
  <script>${script}<\/script>
</body>
</html>`;

    if (iframeRef.current) {
      iframeRef.current.srcdoc = doc;
    }
  };

  useEffect(() => {
    buildPreview();
  }, [nodes, npmPackage]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.type === "console") {
        const formatted = e.data.args
          .map((a: any) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" ");
        setLogs((prev) => [...prev, formatted]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  /* ---------------- EXPORT ---------------- */
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const base64 = reader.result as string;

    const newNode: FileNode = {
      id: Date.now(),
      name: file.name,
      type: "file",
      parent: 1, // dossier src
      language: "plaintext",
      content: base64
    };

    setNodes([...nodes, newNode]);
  };

  reader.readAsDataURL(file);
};
const exportZip = async () => {
  const zip = new JSZip();

  const getPath = (node: FileNode): string => {
    let path = node.name;
    let parent = nodes.find((n) => n.id === node.parent);

    while (parent) {
      path = parent.name + "/" + path;
      parent = nodes.find((n) => n.id === parent.parent);
    }

    return path;
  };

  nodes.forEach((n) => {
    if (n.type === "file") {
      const filePath = getPath(n);
      zip.file(filePath, n.content || "");
    }
  });

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, projectName + ".zip");
};


  /* ---------------- MONACO ---------------- */
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    emmetHTML(monaco);
  };

  /* ---------------- TREE ---------------- */
  const renderTree = (parent: number | null = null, depth: number = 0) => {
    return nodes
      .filter((n) => n.parent === parent)
      .filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      })
      .map((node) => {
        const ext = node.name.split(".").pop();
        const isImage = ["png","jpg","jpeg","gif","svg","webp"].includes(ext || "");
        const isOpen = openFolders.includes(node.id);
        const isActive = activeFile?.id === node.id;

        return (
          <div key={node.id}>
            <div
              className={`
                group flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-lg mx-1 mb-0.5
                transition-all duration-150 
                ${dragging === node.id ? "opacity-50" : ""}
                ${isActive ? "bg-indigo-500/20 text-indigo-300" : "hover:bg-white/5 text-slate-300"}
              `}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              draggable
              onDragStart={(e) => {
                setDragging(node.id);
                e.dataTransfer.setData("nodeId", String(node.id));
              }}
              onDragEnd={() => setDragging(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const draggedId = Number(e.dataTransfer.getData("nodeId"));
                if (node.type === "folder" && draggedId !== node.id) {
                  moveNode(draggedId, node.id);
                }
                setDragging(null);
              }}
              onClick={() => {
                node.type === "folder" ? toggleFolder(node.id) : openFile(node);
              }}
            >
              {node.type === "folder" && (
                <span className="w-3 flex-shrink-0">
                  {isOpen ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                </span>
              )}
{node.type === "folder" ? (
  <Icons.Folder open={isOpen} />
) : isImage ? (
  <span className="text-pink-400 text-sm">IMG</span>
) : (
  <Icons.File ext={ext} />
)}
              <span className="flex-1 truncate text-sm font-medium">{node.name}</span>
              
              <div className="hidden group-hover:flex items-center gap-1">
                {node.type === "folder" && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); createFile(node.id); }}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Nouveau fichier"
                    >
                      <Icons.NewFile />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); createFolder(node.id); }}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Nouveau dossier"
                    >
                      <Icons.NewFolder />
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                  className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>

            {node.type === "folder" && isOpen && renderTree(node.id, depth + 1)}
          </div>
        );
      });
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-white font-['Inter',sans-serif]">
      
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/10">
        
        {/* Logo & Project Name */}
        <div className="flex items-center gap-4">
<div className="flex items-center gap-2">
<img src={logo} className="w-30 h-15 object-contain" alt="LevelUp Logo" />


  <span className="font-semibold text-lg bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
    LevelUpCreation Code
  </span>
</div> 
          <div className="hidden sm:flex items-center bg-[#0d1117] rounded-lg border border-white/10 overflow-hidden">
            <span className="px-3 text-slate-500 text-sm">📁</span>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent py-1.5 pr-3 text-sm text-white outline-none w-36"
              placeholder="Nom du projet"
            />
          </div>
        </div>

        {/* Search & NPM */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center bg-[#0d1117] rounded-lg border border-white/10 px-3 py-1.5">
            <Icons.Search />
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent ml-2 text-sm text-white outline-none w-32"
            />
          </div>
          
          <div className="flex items-center bg-[#0d1117] rounded-lg border border-white/10 px-3 py-1.5">
            <Icons.Package />
            <input
              placeholder="npm package"
              value={npmPackage}
              onChange={(e) => setNpmPackage(e.target.value)}
              className="bg-transparent ml-2 text-sm text-white outline-none w-28"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={formatCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all"
          >
            <Icons.Format />
            <span className="hidden sm:inline">Format</span>
          </button>
          
          <button
            onClick={() => createFile(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all"
          >
            <Icons.NewFile />
            <span className="hidden sm:inline">Fichier</span>
          </button>
          
          <button
            onClick={() => createFolder(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all"
          >
            <Icons.NewFolder />
            <span className="hidden sm:inline">Dossier</span>
          </button>
          <button
  onClick={() => fileInputRef.current?.click()}
  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
>
  Import image
</button>
          <button
            onClick={exportZip}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <Icons.Download />
            <span className="hidden sm:inline">Export ZIP</span>
          </button>
               <button
  onClick={() => window.location.href = "https://levelupcreation.com/"}
  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all"
>
Level Up Creation Site Web
</button>
          <button
  onClick={() => window.location.href = "http://127.0.0.1:5501/dashboard.html"}
  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all"
>
Espace Client
</button>
        </div>
      </header>

<input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  style={{ display: "none" }}
  onChange={handleImageUpload}
/>

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ─────────── FILE TREE ─────────── */}
        <aside className="w-56 lg:w-64 bg-[#0d1117] border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Explorateur
            </h2>
          </div>
          
          <div className="flex-1 overflow-auto py-2 scrollbar-thin">
            {renderTree()}
          </div>
          
          {/* Quick Actions */}
          <div className="p-2 border-t border-white/5 flex gap-1">
            <button
              onClick={() => createFile(1)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
            >
              <Icons.NewFile />
              Fichier
            </button>
            <button
              onClick={() => createFolder(1)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
            >
              <Icons.NewFolder />
              Dossier
            </button>
          </div>
        </aside>

        {/* ─────────── EDITOR ─────────── */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Tabs */}
          <div className="flex items-center bg-[#161b22] border-b border-white/10 overflow-x-auto scrollbar-none">
            {openTabs.map((tab) => {
              const ext = tab.name.split(".").pop();
              const isActive = activeFile?.id === tab.id;
              
              return (
                <div
                  key={tab.id}
                  className={`
                    group flex items-center gap-2 px-4 py-2.5 cursor-pointer border-r border-white/5
                    transition-all duration-150 min-w-max
                    ${isActive 
                      ? "bg-[#0d1117] text-white border-t-2 border-t-indigo-500" 
                      : "text-slate-400 hover:text-white hover:bg-white/5 border-t-2 border-t-transparent"}
                  `}
                  onClick={() => setActiveFile(tab)}
                >
                  <Icons.File ext={ext} />
                  <span className="text-sm font-medium">{tab.name}</span>
                  <button
                    className={`
                      p-0.5 rounded transition-all
                      ${isActive ? "hover:bg-white/10" : "opacity-0 group-hover:opacity-100 hover:bg-white/10"}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTabs = openTabs.filter((t) => t.id !== tab.id);
                      setOpenTabs(newTabs);
                      if (activeFile?.id === tab.id) {
                        setActiveFile(newTabs[newTabs.length - 1] || null);
                      }
                    }}
                  >
                    <Icons.Close />
                  </button>
                </div>
              );
            })}
            
            {openTabs.length === 0 && (
              <div className="px-4 py-2.5 text-slate-500 text-sm">
                Sélectionnez un fichier pour commencer
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  minimap: { enabled: false },
                  formatOnType: true,
                  padding: { top: 16 },
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  bracketPairColorization: { enabled: true },
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                  },
                }}
                onChange={(value) => {
                  setNodes(
                    nodes.map((n) =>
                      n.id === activeFile.id ? { ...n, content: value || "" } : n
                    )
                  );
                  setActiveFile({ ...activeFile, content: value || "" });
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-300 mb-1">Aucun fichier ouvert</h3>
                  <p className="text-sm">Sélectionnez un fichier dans l'explorateur pour commencer à coder</p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ─────────── PREVIEW ─────────── */}
        <aside className="w-[40%] lg:w-[45%] flex flex-col border-l border-white/10">
          
          {/* Preview Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm font-medium text-slate-300 ml-2">Preview</span>
            </div>
            <button
              onClick={buildPreview}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-all"
            >
              <Icons.Refresh />
              Refresh
            </button>
          </div>

          {/* Iframe */}
          <div className="flex-1 bg-white">
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>

          {/* Console */}
          <div className={`bg-[#0d1117] border-t border-white/10 transition-all duration-300 ${consoleOpen ? 'h-40' : 'h-10'}`}>
            <div
              className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5"
              onClick={() => setConsoleOpen(!consoleOpen)}
            >
              <div className="flex items-center gap-2">
                <Icons.Console />
                <span className="text-sm font-medium text-slate-300">Console</span>
                {logs.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium">
                    {logs.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setLogs([]); }}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Effacer"
                >
                  <Icons.Clear />
                </button>
                <span className={`transition-transform duration-300 ${consoleOpen ? 'rotate-180' : ''}`}>
                  <Icons.ChevronDown />
                </span>
              </div>
            </div>
            
            {consoleOpen && (
              <div className="h-[calc(100%-40px)] overflow-auto p-3 font-['JetBrains_Mono',monospace] text-sm space-y-1">
                {logs.length === 0 ? (
                  <div className="text-slate-500 text-xs">Console prête. Les logs apparaîtront ici...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 py-1 px-2 rounded bg-white/5">
                      <span className="text-indigo-400">›</span>
                      <span className="text-emerald-400 break-all">{log}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
