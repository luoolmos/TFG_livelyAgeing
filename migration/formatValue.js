// Función auxiliar para formatear fechas como 'YYYY-MM-DD'
function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function formatToTimestamp(dateString) {
    // Crear un objeto Date a partir de la cadena ISO
    const date = new Date(dateString);

    // Extraer los componentes de la fecha
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Meses van de 0 a 11
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    // Formatear la fecha con microsegundos
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}000`;
    //console.log('Formatted date:', formattedDate);
    return formattedDate;
}

//duration: 00:10:00.000000 --> 10 
function stringToMinutes(value) {
    if (value === null || value === undefined) return null; // Manejo de valores nulos o indefinidos

    if (typeof value === 'string') {
        const parts = value.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            const seconds = parseFloat(parts[2]);
            if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
            return hours * 60 + minutes + Math.floor(seconds / 60);
        } else if (parts.length === 2) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            if (isNaN(hours) || isNaN(minutes)) return null;
            return hours * 60 + minutes;
        } else if (parts.length === 1) {
            const num = parseInt(parts[0], 10);
            if (isNaN(num)) return null;
            return num;
        }
        return null;
    } else if (typeof value === 'number') { 
        return value; // Si ya es un número, devolverlo directamente
    } else return null; // Si no es un string o número, devolver null
}


function milesToMeters(value) {
    return value * 1609.34;
}


 

module.exports = {
    formatDate,
    formatToTimestamp,
    stringToMinutes,
    milesToMeters
}
