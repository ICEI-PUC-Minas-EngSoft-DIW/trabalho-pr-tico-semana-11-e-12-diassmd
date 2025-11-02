const API_URL = "http://localhost:3000/noticias";

document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;

  // =================== INDEX.HTML ===================
  if (path.includes("index.html") || path.endsWith("/")) {
    const container = document.querySelector(".secao-noticias .row");

    try {
      const response = await fetch(API_URL);
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
              <button class="btn btn-danger mt-2 btn-delete" data-id="${noticia.id}">Excluir</button>
            </div>
          </div>
        `;

        container.appendChild(col);
      });

      // DELETE
      container.addEventListener("click", async (e) => {
        if (e.target.classList.contains("btn-delete")) {
          const id = e.target.dataset.id;
          await fetch(`${API_URL}/${id}`, { method: "DELETE" });
          e.target.closest(".col-md-4").remove();
        }
      });

    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
    }
  }

  // =================== DETALHES.HTML ===================
  if (path.includes("detalhes.html")) {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));

    try {
      const response = await fetch(`${API_URL}/${id}`);
      const noticia = await response.json();
      const main = document.querySelector("main");

      if (noticia && main) {
        main.innerHTML = `
          <h1>${noticia.titulo}</h1>
          <img src="${noticia.imagem}" alt="${noticia.titulo}" class="img-fluid mb-3">
          <p>${noticia.conteudo}</p>
          <a href="index.html" class="btn btn-primary mt-2">Voltar</a>
        `;
      } else {
        main.innerHTML = `<p>Notícia não encontrada.</p><a href="index.html">Voltar</a>`;
      }
    } catch (error) {
      document.querySelector("main").innerHTML = `<p>Erro ao carregar notícia.</p><a href="index.html">Voltar</a>`;
    }
  }

  // =================== CADASTRO_NOTICIAS.HTML ===================
  const form = document.querySelector("#form-criar-noticia");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const noticia = {
        titulo: document.getElementById("titulo").value,
        resumo: document.getElementById("resumo").value,
        conteudo: document.getElementById("conteudo").value,
        imagem: document.getElementById("imagem").value
      };

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(noticia)
        });

        if (response.ok) {
          document.getElementById("mensagem").innerHTML = '<div class="alert alert-success">Notícia cadastrada com sucesso!</div>';
          form.reset();
        } else {
          document.getElementById("mensagem").innerHTML = '<div class="alert alert-danger">Erro ao cadastrar notícia.</div>';
        }
      } catch (error) {
        document.getElementById("mensagem").innerHTML = `<div class="alert alert-danger">Erro: ${error}</div>`;
      }
    });
  }
});