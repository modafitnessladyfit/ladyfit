# Ladyfit Collection

Construir a loja virtual Ladyfit de moda fitness feminina para Portugal e Europa com base na imagem de referência anexada. 

Design & Identidade visual:
- Paleta inspirada na imagem: fundo claro, azul-marinho profundo (seções de destaque e hero/rodapé), vermelho vibrante nos botões de CTA, toques de amarelo/dourado na barra superior de anúncio.
- Tipografia forte, geométrica e limpa em caixa alta nos títulos, visual premium/esportivo com bastante respiro (whitespace) e seções amplas.
- Responsividade mobile-first refinada.
- Idioma principal PT (Portugal / PT-PT ou neutro), com seletor e estrutura preparada para EN.

Loja Pública:
- Header com topbar anunciando frete/envio Portugal & Europa, logo LADYFIT, menu (Início, Categorias, Novidades, Mais Vendidos), busca, seletor PT/EN e ícone de carrinho com badge de contagem.
- Hero idêntico ao layout da referência: fundo escuro com gradiente luminoso vermelho/amarelo, headline 'MOVIMENTO COM PRESENÇA. CONFIANÇA EM CADA DETALHE.', descrição e botão CTA vermelho 'EXPLORAR A COLEÇÃO'.
- Seções da Home: Categorias em Destaque, Novidades, Mais Vendidos (seção em tom escuro) e banner institucional.
- Listagem de produtos e filtros por categoria, cor, tamanho e faixa de preço.
- Página detalhada do produto (PDP): galeria de fotos, seleção de cor e tamanho, indicador de estoque, preço com promoção opcional, descrição e botão 'Adicionar ao Carrinho'.
- Carrinho lateral funcional (drawer): listagem de itens adicionados, alteração de quantidade, remoção, cálculo de subtotal/total e botão de finalizar compra mock.

Central Administrativa (/admin):
- Acesso fácil à Central Administrativa (ex: link no rodapé ou cabeçalho).
- Tabela de Cadastro Simplificado de Produtos em estilo Excel:
  * Cada linha representa uma variante (combinação de Produto + Cor + Tamanho).
  * Colunas: Categoria, Produto, Foto, Preço (€), Promoção (€), Tamanho, Cor, Estoque, Status (apenas Rascunho ou Publicado), Ações (Salvar, Duplicar, Excluir).
  * Linha expansível com campos adicionais: Descrição PT, Nome EN, Descrição EN.
  * Barra superior de ações: Novo Produto, Importar Excel, Exportar Excel e Baixar Modelo Excel (ações interativas com feedback mock).
- Cadastros simples de apoio: gestão mock de Categorias e Cores.

Arquitetura:
- Apenas frontend funcional com dados mockados em arquivos dedicados (ex: mockProducts.ts, mockCategories.ts, cartStore), organizados para plugar o Supabase futuramente sem refazer as telas.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d39d4ff7-4ecd-41e1-9293-8c669ec38eec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
