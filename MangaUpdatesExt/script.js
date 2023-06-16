

const unreadChapterString =  document.getElementsByClassName('newlist')
const allLastReadChapterRow = document.getElementsByClassName('p-1 col-md-3 col-4 text-center lcol4 text');
const primeiroCapitulo = document.getElementsByClassName('p-1 col-md-3 col-4 text-center lcol4_top text')[0];
const capitulos=[];
const unreads=[];
const diferencas=[];
var titulo=[];
let i=0;
var somaCaps;
let textoFilho = document.getElementsByTagName('p')[0].firstChild
let textoPai = textoFilho.parentNode;
let textoTroca = document.createElement('b');
textoTroca.classList = 'titulo';

let resultado;



function sumArray(array) {
    let sum = 0; 
    array.forEach(item => {
        sum += item;
      });
      return sum;
    }

capitulos.push(primeiroCapitulo.children[2]['innerText'].split('c.')[1])

for (let capNaoLidos of unreadChapterString){ 

    unreads.push(capNaoLidos['innerText'].split('(c.')[1].replace(')',''));
}

for (let chapterString of allLastReadChapterRow){ 
    
    capitulos.push(chapterString.children[2]['innerText'].split('c.')[1])
    }


unreads.forEach((element ,index)=>{
    let dif=parseInt(element)-parseInt(capitulos[index])
    diferencas.push(dif)

})
   

for (let capNaoLidos of unreadChapterString){ 
    
   capNaoLidos['innerText']+=(' Não lidos:'+diferencas[i]);
   i++;
}
//console.log(sumArray(diferencas)+ ' capítulos não lidos');
resultado = sumArray(diferencas);


var textoTituloTroca = document.createTextNode('Total Unread Chapters: '+resultado);
textoTroca.appendChild(textoTituloTroca);

textoPai.replaceChild(textoTroca,textoFilho);
