
export function satoshi(value) {
    if (isNaN(value))
        return 0
    
    return Math.floor(value * 100000000)
}

export function bitcoin(value) {
    if (isNaN(value))
        return 0

    value = parseInt(value) / 100000000
    let round = parseFloat(value.toFixed(8))
    
    return round
}