import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("checklist.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS fazendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tratores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    fazenda_id INTEGER,
    FOREIGN KEY (fazenda_id) REFERENCES fazendas(id)
  );

  CREATE TABLE IF NOT EXISTS checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT DEFAULT (datetime('now', 'localtime')),
    operador TEXT NOT NULL,
    trator_id INTEGER,
    horimetro TEXT,
    respostas TEXT, -- JSON string containing all checklist items
    observacoes TEXT,
    foto TEXT,
    status_geral TEXT,
    FOREIGN KEY (trator_id) REFERENCES tratores(id)
  );
`);

// Seed Data if empty
const farmCount = db.prepare("SELECT COUNT(*) as count FROM fazendas").get() as { count: number };
if (farmCount.count === 0) {
  const insertFarm = db.prepare("INSERT INTO fazendas (nome) VALUES (?)");
  const insertTractor = db.prepare("INSERT INTO tratores (nome, fazenda_id) VALUES (?, ?)");

  const farmsData = [
    {
      nome: "PARAÍSO",
      tratores: [
        "TR01 – MF 4275 PLATAFORMADO",
        "TR02 – NEW HOLLAND",
        "TR03 – MF 4275",
        "TR04 – MF 4275",
        "TR05 – YANMAR 1050",
        "TR06 – MF 4275 PLATAFORMADO",
        "TR07 – MF 290",
        "TR08 – MF 3307",
        "TR09 – JOHN DEERE 5425",
        "TR10 – MF 4275",
        "TR11 – MF 3307",
        "TR12 – NEW HOLLAND",
        "TR13 – NEW HOLLAND",
        "TR14 – JOHN DEERE 5080E"
      ]
    },
    {
      nome: "RANCHARIA",
      tratores: [
        "TR01 – MF 265",
        "TR02 – MF 4275",
        "TR03 – MF 3307",
        "TR04 – MF 3307",
        "TR05 – NEW HOLLAND",
        "TR06 – JOHN DEERE 5080E"
      ]
    },
    {
      nome: "SÃO JOSÉ",
      tratores: [
        "TR01 – YANMAR 1050",
        "TR02 – MF 4275",
        "TR03 – MF 4275",
        "TR04 – MF 3307",
        "TR05 – NEW HOLLAND",
        "TR06 – YANMAR SOLIS 75"
      ]
    },
    {
      nome: "MARIA TEREZA",
      tratores: [
        "TR01 – MF 4275",
        "TR02 – MF 4275",
        "TR03 – NEW HOLLAND"
      ]
    },
    {
      nome: "C2",
      tratores: [
        "TR01 – MF 4275 PLATAFORMADO",
        "TR02 – MF 4275",
        "TR03 – MF 4275",
        "TR04 – NEW HOLLAND",
        "TR05 – MF 3307",
        "TR06 – MF 265",
        "TR07 – MF 275",
        "TR08 – YANMAR 1050",
        "TR09 – NEW HOLLAND",
        "TR10 – YANMAR SOLIS"
      ]
    },
    {
      nome: "CURAÇÁ",
      tratores: [
        "TR01 – MF 275",
        "TR02 – MF 290",
        "TR03 – MF 4275",
        "TR04 – MF 3307",
        "TR05 – YANMAR 1050",
        "TR06 – NEW HOLLAND",
        "TR07 – NEW HOLLAND",
        "TR08 – YANMAR SOLIS 75 (2025)"
      ]
    },
    {
      nome: "CASA NOVA",
      tratores: [
        "TR01 – MF 4275",
        "TR02 – MF 4275",
        "TR03 – JOHN DEERE 5075E (2012)"
      ]
    }
  ];

  for (const farm of farmsData) {
    const farmId = insertFarm.run(farm.nome).lastInsertRowid;
    for (const tractor of farm.tratores) {
      insertTractor.run(tractor, farmId);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/fazendas", (req, res) => {
    const fazendas = db.prepare("SELECT * FROM fazendas").all();
    res.json(fazendas);
  });

  app.get("/api/tratores/:fazendaId", (req, res) => {
    const tratores = db.prepare("SELECT * FROM tratores WHERE fazenda_id = ?").all(req.params.fazendaId);
    res.json(tratores);
  });

  app.post("/api/checklist", async (req, res) => {
    try {
      const {
        operador,
        trator_id,
        horimetro,
        respostas,
        observacoes,
        foto,
        status_geral,
        fazenda_nome,
        trator_nome
      } = req.body;

      const stmt = db.prepare(`
        INSERT INTO checklists (operador, trator_id, horimetro, respostas, observacoes, foto, status_geral)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(operador, trator_id, horimetro, JSON.stringify(respostas), observacoes, foto, status_geral);

      // Send Email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const isUrgente = status_geral === "URGENTE";
      const subject = "Novo Check-list de Trator";

      const itensHtml = Object.entries(respostas).map(([item, status]) => {
        const color = status === 'NC' ? 'red' : (status === 'C' ? 'green' : 'gray');
        return `<li><strong>${item}:</strong> <span style="color: ${color}; font-weight: bold;">${status}</span></li>`;
      }).join('');

      const mailOptions: any = {
        from: process.env.EMAIL_FROM,
        to: "joao.victor@sweetfruits.com.br",
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
            <h2 style="text-align: center; color: ${isUrgente ? '#dc2626' : '#059669'};">Novo Check-list de Trator</h2>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Status Geral:</strong> <span style="color: ${isUrgente ? '#dc2626' : '#059669'}; font-weight: bold;">${status_geral}</span></p>
            <p><strong>Fazenda:</strong> ${fazenda_nome}</p>
            <p><strong>Trator:</strong> ${trator_nome}</p>
            <p><strong>Operador:</strong> ${operador}</p>
            <p><strong>Horímetro:</strong> ${horimetro}</p>
            <hr />
            <h3>Itens do Check-list:</h3>
            <ul style="list-style: none; padding: 0;">
              ${itensHtml}
            </ul>
            <hr />
            <p><strong>Problemas encontrados:</strong> ${isUrgente ? "Sim (ver itens em vermelho)" : "Não"}</p>
            <p><strong>Observações:</strong> ${observacoes || "Nenhuma"}</p>
          </div>
        `,
      };

      if (foto) {
        // Attach base64 image
        const base64Data = foto.split(",")[1];
        mailOptions.attachments = [
          {
            filename: "foto_checklist.jpg",
            content: base64Data,
            encoding: "base64",
          },
        ];
      }

      // Only attempt to send if SMTP is configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER !== "user@example.com") {
        await transporter.sendMail(mailOptions);
      } else {
        console.log("SMTP not configured, skipping email send.");
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving checklist:", error);
      res.status(500).json({ error: "Erro ao salvar checklist" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
