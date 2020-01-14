const request = require('request-promise-native');
const crypto = require('crypto');


const token = 'dd4450c7edf7deccc80c26a67554668f59ce003b'
const apiUrl = `https://api.codenation.dev/v1`
const getChallengeEndpoint = `/challenge/dev-ps/generate-data?token=${token}`
const sendChallengeEndpoint = `/challenge/dev-ps/submit-solution?token=${token}`

async function decifrador(responseData){
    let alpha = 'abcdefghijklmnopqrstuvwxyz'; // Definição do Alfabeto
    let alphaArr = alpha.split('') // Transformando alfabeto em array
    
    let letrasCifradas = responseData.cifrado.split(''); // Transformando cada caractere da frase cifrada em itens de um array.
    let letrasDecifradas = [] // Definindo array que irá receber as caracteres decifradas.

    for (let letra of letrasCifradas){ // Iteração por caractere do array da frase cifrada.    
        
        /**
         * Caso o item do array esteja no array do alfabeto 
         * (validação necessária para evitar caracteres especiais)
         */
        if (alphaArr.indexOf(letra) > -1){  
            // Encontrado a posição no alfabeto da letra cifrada e deduzindo o numero de casas.
            let newposition = alphaArr.indexOf(letra) - responseData.numero_casas 

            // Caso a posição da letra decifrada seja menor que 0, soma-se a quantidade de letras do alfabeto
            if (newposition < 0) {
                newposition = newposition + alphaArr.length 
            }

            letrasDecifradas.push(alphaArr[newposition]) // Envia a nova letra (decifrada) ao array
        } else {
            letrasDecifradas.push(letra) // Envia caracteres especiais ao array sem modificá-los
        }        
    }
    letrasDecifradas= letrasDecifradas.join('') // Transforma array em string com a frase decifrada
    responseData.decifrado = letrasDecifradas // Coloca a frase no objeto original, no campo solicitado.
    responseData.resumo_criptografico = crypto.createHash('sha1').update(responseData.decifrado).digest('hex'); // Gera SHA1 da frase decifrada.
    return responseData;}


/**
 * Na função auto invocada abaixo, é coletado o retorno da função decifrador,
 * enviado como multipart/form-data ao servidor, e devolvido o score.
 */
(async function(){
    const response = await request.get(`${apiUrl + getChallengeEndpoint}`)
    const decifrado = await decifrador(JSON.parse(response));
    const formData = {
        answer: {
            value: Buffer.from(JSON.stringify(decifrado)),
            options: {
                filename: 'answer.json',
                contentType: 'text/plain'
            }
        }
    }
    const sending = await request.post({url:`${apiUrl + sendChallengeEndpoint}`, formData: formData }).catch(err => new Error(err))
    console.log(`Nota: ${JSON.parse(sending).score}`)
})()