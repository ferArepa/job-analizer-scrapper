import { Url } from "url"

export interface Post {

  pagina: number
  indice: number
  titulo: string
  url: Url
  contenido_dinamico: string
}
