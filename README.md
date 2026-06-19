# Busca do QR Code - Novo GLB integrado

Esta versão usa o novo arquivo que você enviou:

```txt
assets/personagem_novo.glb
```

## Como rodar

1. Extraia o ZIP.
2. Abra a pasta no VS Code.
3. Use a extensão **Live Server**.
4. Clique com o botão direito em `index.html`.
5. Escolha **Open with Live Server**.

## Controles

- `W A S D` ou setas: andar
- `E`: abrir QR Code quando estiver perto da placa

## Inspeção do GLB recebido

- Tamanho: 15.13 MB
- Animações encontradas: 0
- Nomes das animações: nenhuma
- Skins/Rig encontrados: 0
- Nós: 1
- Meshes: 1
- Materiais: 1
- Texturas: 3
- Imagens embutidas: 3

## Correção aplicada

Mantive a correção para evitar o personagem preto/sem cor:
- `SRGBColorSpace` nas texturas;
- luz ambiente e luz frontal reforçadas;
- material com `metalness` menor;
- `roughness` ajustado;
- exposição do render aumentada.


## Correção de direção

Esta versão corrige a orientação do personagem:
- W / seta para cima: anda para frente em direção ao QR Code;
- S / seta para baixo: volta para o início;
- A / seta esquerda: vai para esquerda;
- D / seta direita: vai para direita;
- o modelo recebeu `modelYawOffset = Math.PI / 2` para não ficar de lado ao andar.

Se outro GLB futuro ficar invertido, no arquivo `src/main.js` altere:

```js
modelYawOffset: Math.PI / 2
```

para:

```js
modelYawOffset: -Math.PI / 2
```


## Correção W/S

Nesta versão eu mantive o movimento das teclas igual, mas inverti a frente visual do GLB.

Antes:
- W movia para frente, mas o personagem olhava para baixo/trás;
- S movia para trás, mas o personagem olhava para cima/frente.

Agora:
- W faz o personagem olhar e andar para frente, em direção ao QR Code;
- S faz o personagem olhar e voltar para trás.

Correção aplicada em `src/main.js`:

```js
modelYawOffset: -Math.PI / 2
```


## QR Code atualizado

O QR Code enviado foi colocado no projeto como:

```txt
assets/qr-code.png
```

Ele aparece em dois lugares:
- na placa 3D dentro do mapa;
- na janela/modal quando o jogador pressiona `E` perto da placa.


## Alterações desta versão

- cenário refeito para uma caminhada pelo espaço;
- estrelas, nebulosas e planetas;
- visual do mapa mais profissional;
- passarela espacial com iluminação neon;
- distância bem maior entre o início e o QR Code;
- mesma personagem 3D e mesmo QR Code real.

## Como ficou a distância

- início: `z = 16`
- QR Code: `z = -66`

Isso deixou o percurso muito maior do que a versão anterior.


## Ajustes desta versão

- painel superior simplificado para mostrar apenas as instruções de movimento;
- modal do QR Code reformulado com visual escuro/espacial;
- fundo do modal com estrelas e brilho para combinar com o cenário;
- layout branco removido.


## Ajuste da tela inicial

- mantida a caixa superior como no print;
- removido apenas o texto `3D`;
- título ajustado para `For Lara☀️`;
- botão `Começar` mantido.


## Link no QR Code

Além de escanear, agora também é possível clicar no QR Code no popup final.

Link configurado:

```txt
https://open.spotify.com/intl-pt/track/1kFevEv3s7Gf6o5xSDR5DL?si=4784daa51f19404b
```


## Versão otimizada para celular

Alterações de desempenho:
- limite de pixel ratio no celular;
- sombras desativadas no celular;
- menos estrelas e objetos decorativos;
- menos rochas/luzes/efeitos;
- geometria mais leve;
- controles mobile ajustados.

Se ainda travar, o maior peso é o arquivo `assets/personagem_novo.glb`, que tem cerca de 15 MB. Para ficar ainda mais leve, seria necessário comprimir o GLB no Blender ou exportar com textura menor.
