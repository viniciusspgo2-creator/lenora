# Upload de imagens na Vercel — correção do EROFS

O erro `EROFS: read-only file system, open /var/task/public/uploads/...` acontece porque, em produção, os arquivos do deployment da Vercel são somente leitura.

Esta versão não tenta mais salvar imagens dentro de `public/uploads` quando está em produção. As imagens são convertidas para WebP (máx. 1600 px) e enviadas para **Vercel Blob**, que é persistente.

## Configuração necessária (uma única vez)

1. Abra o projeto no painel da Vercel.
2. Entre em **Storage**.
3. Crie ou conecte um **Blob store** ao mesmo projeto.
4. Para fotos públicas de produtos, use um store com acesso **Public**.
5. Faça um **novo deploy** do projeto depois de conectar o Blob.
6. Volte ao painel da loja e teste o upload.

Em stores que usam token legado, a variável `BLOB_READ_WRITE_TOKEN` é criada/conectada pelo painel. Stores novas podem usar autenticação OIDC pelo SDK atual.

## Desenvolvimento local

Fora da produção, o projeto continua usando `public/uploads`, então o fluxo local segue funcionando sem Blob.
