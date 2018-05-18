const algos = [
    {
        name: "MFI",
        params: [
            {
                name: "period",
                min: 15,
                max: 30,
                inc: 1
            }
        ]
    },
    {
        name: "BB",
        params: [
            {
                name: "period",
                min: 10,
                max: 30,
                inc: 1
            },
            {
                name: "stdNum",
                min: 1,
                max: 3,
                inc: 1
            },
        ]
    }
];
    function makeParamArr(algos) {
    let arr = [];
    for (let index = algos.params[0].min; index <= algos.params[0].max; index += algos.params[0].inc) {
        arr.push(index);
        
    }
    return arr;
}
console.log(makeParamArr(algos[0]))
console.log(makeParamArr(algos[1]))