import jsPDF from 'jspdf';

/**
 * Display input
 */
var inputIds = [document.getElementById('guiontitulo'),document.getElementById('cabecera'),document.getElementById('introduccion'), document.getElementById('tema'), document.getElementById('temacont'),document.getElementById('despedida'),document.getElementById('final')],
    bgas = [],
    ygSliderCont = document.getElementById('ygSliderCont'),
    btnpdf = document.getElementById('myguionpdf');
/**
 * ForEach loop to add content to an array to use it later
 */
inputIds.forEach((el, indx) =>{
    el.style.backgroundColor = "white";
    el.addEventListener('change', function(){
        //cambia a verde cuando hay texto
        el.style.backgroundColor = "lightgreen";
        bgas[indx] = el.value;
    });
});

/**
 * pdf printing
 */
btnpdf.onclick= function(){
    /**
     * crear PDF
     */
     var doc = new jsPDF('p', 'pt', 'letter');
     var margin = 10;
     var scale = (doc.internal.pageSize.width - margin * 2) / document.body.clientWidth;
     var scale_mobile = (doc.internal.pageSize.width - margin * 2) / document.body.getBoundingClientRect();
     var blocktxt = document.querySelectorAll('blocktxt');
     
     

     if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
        // true for mobile device
        doc.html(document.querySelector('.contentinput'), {
            x: margin,
            y: margin,
            html2canvas: {
                scale: scale_mobile,
            },
            callback: function(doc){
                /* Export to a new window in explorer - works outside codepen in local enviroment*/
                // doc.output('dataurlnewwindow', {filename: 'fichero-pdf.pdf'});
              /* Save/Download the pdf to your pc*/
              doc.save('fichero-pdf.pdf');
            }
        });
      }else{
          //true for pc, false for mobile devices
        doc.html(document.querySelector('.contentinput'), {
            x: margin,
            y: margin,
            html2canvas: {
                scale: scale,
            },
            callback: function(doc){
              /* Export to a new window in explorer - works outside codepen in local enviroment */
                // doc.output('dataurlnewwindow', {filename: 'fichero-pdf.pdf'});
              /* Save/Download the pdf to your pc*/
              doc.save('fichero-pdf.pdf');
            }
        });
      }
    
    
 }
