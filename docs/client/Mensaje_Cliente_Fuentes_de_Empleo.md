# Fuentes de empleo: qué construimos y por qué recomiendo evaluar una API paga

Hola Federico,

Quiero explicarte cómo quedó armado el motor de búsqueda de empleos y plantearte una
decisión que conviene tomar pronto, porque define cuánto volumen de ofertas podemos
entregarle al usuario.

## Cómo funciona hoy

Construimos el buscador con un **formato único de oferta**: sin importar de dónde venga
un empleo, entra al sistema con la misma estructura (puesto, empresa, ubicación,
modalidad, descripción y link de postulación). Sobre ese formato común corren después
el filtro por región y modalidad, y el ranking por compatibilidad con el CV.

Esto es importante por una razón práctica: **sumar una fuente nueva no obliga a rehacer
nada**. Se conecta, se traduce al formato común, y automáticamente queda filtrada y
ordenada como el resto. Es la base sobre la que te propongo el siguiente paso.

Hoy el sistema toma ofertas de dos tipos de fuente, ambas **gratuitas**:

- **Portales de empleo remoto** (varios, internacionales). Funcionan bien, pero por
  definición solo traen trabajo remoto.
- **Portales de empleo de empresas de la región**, que fue lo que sumamos para resolver
  el problema del trabajo presencial. De acá salen las ofertas presenciales reales en
  São Paulo, Ciudad de México y Buenos Aires.

## El límite honesto de este esquema

La segunda fuente funciona **empresa por empresa**: incorporamos el portal de empleos de
cada compañía de la región. Es gratis y da ofertas reales y verificadas, pero el volumen
crece de a poco, en proporción al trabajo de ir sumando empresas una por una.

Para que tengas la dimensión: recién verifiqué que sumando una sola empresa más de la
región (Despegar) se agregan más de 100 puestos. Podemos seguir ampliando esa lista, y
lo vamos a hacer. Pero aun así **no llega al volumen de un buscador masivo**, y hay una
razón de fondo: **no existe una fuente gratuita y confiable que agregue empleo
presencial por ciudad en Latinoamérica**. Las que existen son de pago.

## Lo que recomiendo evaluar

Contratar **una API de empleos paga** e integrarla como una fuente más del sistema. Esto
cambia la escala: en lugar de sumar empresa por empresa, se accede de una sola vez a
miles de ofertas por ciudad y por país, incluyendo presenciales.

Proveedores que conviene cotizar (todos ofrecen acceso por API):

- **Jooble** — agregador con presencia amplia en Latinoamérica, incluida Chile.
- **Adzuna** — buena cobertura en Brasil y México.
- **Careerjet** — cobertura muy amplia por país, con un modelo de afiliados.
- **Google Jobs vía servicios tipo JSearch / SerpApi** — acceso indirecto al mayor
  agregador de empleo que existe.

No te paso precios porque las condiciones las define cada proveedor según volumen de
consultas y países, y prefiero no darte un número inventado: lo correcto es pedir
cotización a dos o tres con nuestro caso concreto (países objetivo y cantidad estimada
de búsquedas por día).

## Qué implicaría del lado del desarrollo

Poco, y esa es la buena noticia. Como todo entra por el formato único que te mencioné,
integrar una API paga es **conectar una fuente más**: no cambia el buscador, ni el
ranking por CV, ni la experiencia del usuario. El trabajo está en la conexión y las
pruebas, no en rehacer el motor.

## Mi recomendación

1. Seguimos ampliando la fuente gratuita de empresas de la región (sin costo, en curso).
2. En paralelo, pedimos cotización a Jooble y Adzuna con nuestros países objetivo.
3. Con esos números decidís si el volumen extra justifica el costo mensual.

Si te parece bien, avanzo con el punto 1 y preparo el detalle técnico que necesitamos
para pedir las cotizaciones del punto 2.

Quedo atento.

Saludos,
