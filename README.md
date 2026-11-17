# Padel Match — Sorteio de Jogos

Aplicação React + Vite pronta para publicação na Vercel.

## Publicar na Vercel

1. Extraia `padel-sorteio-vercel.zip`.
2. Envie a pasta `padel-sorteio` para um repositório GitHub.
3. Na Vercel, escolha **Add New → Project** e importe o repositório.
4. A Vercel identifica Vite automaticamente. Confirme:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Clique em **Deploy**. Não são necessárias variáveis de ambiente.

Também é possível executar localmente com `npm install` e `npm run dev`.

## Funcionalidades

- Cadastro ilimitado de atletas em duas listas: Direitas e Esquerdas.
- Sorteio de duplas sempre com uma Direita e uma Esquerda.
- Confrontos aleatórios e tentativa de evitar repetir duplas de rodadas anteriores.
- Geração de uma rodada por vez, com botão para sortear a próxima.
- Grade de quadras: 3 quadras antes das 13h e 4 quadras a partir das 13h.
- Duração de jogo, início e fim configuráveis.
- Marcação de jogos concluídos e exportação do histórico em CSV.
- Dados salvos no armazenamento local do navegador.

## Observação sobre os dados

Esta primeira versão não usa banco de dados: os atletas e rodadas ficam salvos no navegador/dispositivo em que o sistema é utilizado. Para uma operação compartilhada entre vários celulares ou computadores, conecte um banco de dados (por exemplo, Supabase) numa próxima versão.
