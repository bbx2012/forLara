# Busca do QR Code - Novo GLB integrado

Esta versão usa o novo arquivo 
```



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

##Correção aplicada

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
- o modelo recebeu `modelYawOffset = Math.PI / 2` 
```


## Correção W/S


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


Link configurado:

```txt
https://open.spotify.com/intl-pt/track/1kFevEv3s7Gf6o5xSDR5DL?si=4784daa51f19404b
```
