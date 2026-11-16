#let pdf = "example.pdf"
#let page-count = 1


// Set the PDF to edit as background
#set page(
  paper: "a4",
  margin: 0pt,
  background: context {
    let pdf-page = counter(page).get().first()
    image(pdf, page: pdf-page,width: 100%)
  },
)

#let correction-show(elements) = [

  #set text(fill: red)

  #{
    for page in range(page-count) {
      let elements-on-page = elements.filter(el => el.page == page)

      for element in elements {
        place(
          top + left,
          dx: element.x,
          dy: element.y,
          float: false,
          element.content,
        )
      }
      if (page < page-count - 1){
        [#pagebreak()]
      }
    }
  }

  #[] <end-of-edit>

  // This code fills the document with page-breaks. This
  // way the whole PDF is in the Typst document as background
/*   #context {
    let current-pages = query(<end-of-edit>).first().location().page()
    for _ in range(page-count - current-pages) {
      //pagebreak()
    }
  } */
]

#let elements = (
  (x:0pt,y:0pt,page:1,content: [Bla]),
  
)


#show: correction-show(elements)
