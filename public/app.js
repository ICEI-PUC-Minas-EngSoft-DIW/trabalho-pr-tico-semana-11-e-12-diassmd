/************************************************************
 * API URLs
 ************************************************************/
const API_URL_NOTICIAS = "http://localhost:3000/noticias";
const API_URL_USUARIOS = "http://localhost:3000/usuarios";

/************************************************************
 * SESSION STORAGE – USUÁRIO LOGADO
 ************************************************************/
function getUsuarioSessao() {
  const raw = sessionStorage.getItem("usuarioLogado");
  return raw ? JSON.parse(raw) : null;
}

function salvarSessao(usuario) {
  sessionStorage.setItem("usuarioLogado", JSON.stringify(usuario));
  atualizarMenu();
}

function logout() {
  sessionStorage.removeItem("usuarioLogado");
  atualizarMenu();
  window.location.href = "index.html";
}

/************************************************************
 * MENU DINÂMICO
 ************************************************************/
function atualizarMenu() {
  const menu = document.getElementById("menu-principal");
  if (!menu) return;

  const user = getUsuarioSessao();
  let html = `<ul class="nav">`;

  html += `
    <li class="nav-item"><a href="index.html" class="nav-link text-white">Início</a></li>
  `;

  if (user?.admin) {
    html += `
      <li class="nav-item"><a href="cadastro_noticias.html" class="nav-link text-white">Cadastrar Notícia</a></li>
    `;
  }

  if (user) {
    html += `
      <li class="nav-item"><a href="favoritos.html" class="nav-link text-white">Favoritos</a></li>
    `;
  }

  if (!user) {
    html += `
      <li class="nav-item"><a href="login.html" class="nav-link text-white">Login</a></li>
      <li class="nav-item"><a href="cadastro_usuario.html" class="nav-link text-white">Cadastrar</a></li>
    `;
  } else {
    html += `
      <li class="nav-item"><span class="nav-link text-white">Olá, ${user.nome}</span></li>
      <li class="nav-item"><a href="#" id="btnLogout" class="nav-link text-white">Logout</a></li>
    `;
  }

  html += `</ul>`;
  menu.innerHTML = html;

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", logout);
}

/************************************************************
 * LOGIN
 ************************************************************/
async function fazerLogin(e) {
  e.preventDefault();

  const login = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const msg = document.getElementById("msg-login");

  msg.innerHTML = "Verificando...";

  const resp = await fetch(`${API_URL_USUARIOS}?login=${login}&senha=${senha}`);
  const dados = await resp.json();

  if (dados.length === 0) {
    msg.innerHTML = `<div class="alert alert-danger">Login ou senha incorretos.</div>`;
    return;
  }

  const usuario = dados[0];
  if (!Array.isArray(usuario.favoritos)) usuario.favoritos = [];

  delete usuario.senha;
  salvarSessao(usuario);

  msg.innerHTML = `<div class="alert alert-success">Login realizado! Redirecionando...</div>`;
  setTimeout(() => window.location.href = "index.html", 800);
}

/************************************************************
 * CADASTRO DE USUÁRIO
 ************************************************************/
async function cadastrarUsuario(e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const loginUser = document.getElementById("loginUser").value.trim();
  const senhaUser = document.getElementById("senhaUser").value;
  const admin = document.getElementById("marcarAdmin")?.checked || false;

  const msg = document.getElementById("msg-cadastro");

  const check = await fetch(`${API_URL_USUARIOS}?login=${loginUser}`);
  const existe = await check.json();

  if (existe.length > 0) {
    msg.innerHTML = `<div class="alert alert-danger">Login já existe.</div>`;
    return;
  }

  const novoUsuario = {
    nome,
    email,
    login: loginUser,
    senha: senhaUser,
    admin,
    favoritos: []
  };

  const resp = await fetch(API_URL_USUARIOS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novoUsuario)
  });

  if (resp.ok) {
    msg.innerHTML = `<div class="alert alert-success">Cadastro realizado! Faça login.</div>`;
    setTimeout(() => (window.location.href = "login.html"), 1000);
  } else {
    msg.innerHTML = `<div class="alert alert-danger">Erro ao cadastrar usuário.</div>`;
  }
}

/************************************************************
 * CARREGAR NOTÍCIAS NA HOME
 ************************************************************/
async function carregarNoticiasIndex() {
  const container = document.querySelector(".secao-noticias .row");
  if (!container) return;

  const user = getUsuarioSessao();

  try {
    const response = await fetch(API_URL_NOTICIAS);
    const noticias = await response.json();

    noticias.forEach(noticia => {
      const col = document.createElement("div");
      col.classList.add("col-md-4");

      col.innerHTML = `
        <div class="card h-100">
          <img src="${noticia.imagem}" class="card-img-top" alt="${noticia.titulo}">
          <div class="card-body">
            <h3 class="card-title">${noticia.titulo}</h3>
            <p class="card-text">${noticia.resumo}</p>

            <a href="detalhes.html?id=${noticia.id}" class="btn btn-primary mt-2">Ler mais</a>

            ${user ? `
              <button class="btn btn-light mt-2 btn-fav" data-id="${noticia.id}">
                <span class="heart ${user.favoritos.includes(noticia.id) ? 'fav' : ''}">❤</span>
              </button>
            ` : ''}

            ${user?.admin ? `
              <button class="btn btn-danger mt-2 btn-delete" data-id="${noticia.id}">Excluir</button>
            ` : ""}
          </div>
        </div>
      `;

      container.appendChild(col);
    });

    container.addEventListener("click", async (e) => {
      const favBtn = e.target.closest(".btn-fav");
      const delBtn = e.target.closest(".btn-delete");

      // FAVORITOS
      if (favBtn) {
        const noticiaId = parseInt(favBtn.dataset.id);
        let usuario = getUsuarioSessao();

        if (usuario.favoritos.includes(noticiaId)) {
          usuario.favoritos = usuario.favoritos.filter(id => id !== noticiaId);
        } else {
          usuario.favoritos.push(noticiaId);
        }

        salvarSessao(usuario);

        await fetch(`${API_URL_USUARIOS}/${usuario.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favoritos: usuario.favoritos })
        });

        favBtn.querySelector(".heart").classList.toggle("fav");
      }

      // DELETE (somente admin)
      if (delBtn) {
        const id = delBtn.dataset.id;
        await fetch(`${API_URL_NOTICIAS}/${id}`, { method: "DELETE" });
        delBtn.closest(".col-md-4").remove();
      }
    });

  } catch (error) {
    console.error("Erro ao carregar notícias:", error);
  }
}
async function ativarPesquisaNoticias() {
  const input = document.getElementById("campoPesquisa");
  if (!input) return; // se não estiver na página index.html

  input.addEventListener("input", async () => {
    const termo = input.value.toLowerCase().trim();

    const container = document.querySelector(".secao-noticias .row");
    container.innerHTML = ""; // limpar

    const response = await fetch(API_URL_NOTICIAS);
    const noticias = await response.json();

    const filtradas = noticias.filter(noticia =>
      noticia.titulo.toLowerCase().includes(termo) ||
      noticia.resumo.toLowerCase().includes(termo)
    );

    filtradas.forEach(noticia => {
      const user = getUsuarioSessao();

      const col = document.createElement("div");
      col.classList.add("col-md-4");

      col.innerHTML = `
        <div class="card h-100">
          <img src="${noticia.imagem}" class="card-img-top" alt="${noticia.titulo}">
          <div class="card-body">
            <h3 class="card-title">${noticia.titulo}</h3>
            <p class="card-text">${noticia.resumo}</p>

            <a href="detalhes.html?id=${noticia.id}" class="btn btn-primary mt-2">Ler mais</a>

            ${user ? `
              <button class="btn btn-light mt-2 btn-fav" data-id="${noticia.id}">
                <span class="heart ${user.favoritos.includes(noticia.id) ? 'fav' : ''}">❤</span>
              </button>
            ` : ""}
          </div>
        </div>
      `;

      container.appendChild(col);
    });
  });
}
/************************************************************
 * DETALHES (SEM LISTA DE FAVORITOS)
 ************************************************************/
async function carregarDetalhes() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));
  const main = document.querySelector("main");
  if (!main) return;

  const user = getUsuarioSessao();

  try {
    const response = await fetch(`${API_URL_NOTICIAS}/${id}`);
    const noticia = await response.json();

    if (!noticia) {
      main.innerHTML = `<p>Notícia não encontrada.</p>`;
      return;
    }

    const isFav = user?.favoritos.includes(id);

    let html = `
      <h1>${noticia.titulo}</h1>
      <img src="${noticia.imagem}" class="img-fluid mb-3">
      <p>${noticia.conteudo}</p>
    `;

    if (user) {
      html += `
        <button id="btnFavDetalhes" class="btn btn-light mb-3" data-id="${id}">
          <span class="heart ${isFav ? "fav" : ""}">❤</span>
        </button>
      `;
    }

    html += `<a href="index.html" class="btn btn-primary mt-3">Voltar</a>`;

    main.innerHTML = html;

    if (user) {
      const btn = document.getElementById("btnFavDetalhes");
      btn.addEventListener("click", async () => {
        let usuario = getUsuarioSessao();

        if (usuario.favoritos.includes(id)) {
          usuario.favoritos = usuario.favoritos.filter(x => x !== id);
        } else {
          usuario.favoritos.push(id);
        }

        salvarSessao(usuario);

        await fetch(`${API_URL_USUARIOS}/${usuario.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favoritos: usuario.favoritos })
        });

        btn.querySelector(".heart").classList.toggle("fav");
      });
    }

  } catch (error) {
    main.innerHTML = `<p>Erro ao carregar notícia.</p>`;
  }
}

/************************************************************
 * PÁGINA FAVORITOS
 ************************************************************/
async function carregarFavoritos() {
  const container = document.getElementById("lista-favoritos");
  if (!container) return;

  const usuario = getUsuarioSessao();
  if (!usuario) {
    container.innerHTML = `<p>Faça login para ver seus favoritos.</p>`;
    return;
  }

  if (usuario.favoritos.length === 0) {
    container.innerHTML = `<p>Nenhum favorito ainda.</p>`;
    return;
  }

  const response = await fetch(API_URL_NOTICIAS);
  const todas = await response.json();

  const favoritas = todas.filter(n => usuario.favoritos.includes(n.id));

  favoritas.forEach(f => {
    container.innerHTML += `
      <div class="card mb-3">
        <div class="card-body">
          <h4>${f.titulo}</h4>
          <a href="detalhes.html?id=${f.id}" class="btn btn-primary">Ver notícia</a>
        </div>
      </div>
    `;
  });
}

/************************************************************
 * CADASTRO DE NOTÍCIA
 ************************************************************/
function initCadastroNoticias() {
  const form = document.getElementById("form-criar-noticia");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const noticia = {
      titulo: document.getElementById("titulo").value,
      resumo: document.getElementById("resumo").value,
      conteudo: document.getElementById("conteudo").value,
      imagem: document.getElementById("imagem").value
    };

    const resp = await fetch(API_URL_NOTICIAS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noticia)
    });

    document.getElementById("mensagem").innerHTML = resp.ok
      ? `<div class="alert alert-success">Notícia cadastrada!</div>`
      : `<div class="alert alert-danger">Erro ao cadastrar.</div>`;

    if (resp.ok) form.reset();
  });
}

/************************************************************
 * ROTEAMENTO POR PÁGINA
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  atualizarMenu();

  const path = window.location.pathname;

  if (path.includes("index") || path.endsWith("/")) {
  carregarNoticiasIndex();
  ativarPesquisaNoticias(); // ← ADICIONADO!
}
  if (path.includes("detalhes")) carregarDetalhes();
  if (path.includes("cadastro_noticias")) initCadastroNoticias();
  if (path.includes("favoritos")) carregarFavoritos();

  if (path.includes("login")) {
    const form = document.getElementById("form-login");
    if (form) form.addEventListener("submit", fazerLogin);
  }

  if (path.includes("cadastro_usuario")) {
    const form = document.getElementById("form-cadastro");
    if (form) form.addEventListener("submit", cadastrarUsuario);
  }
});