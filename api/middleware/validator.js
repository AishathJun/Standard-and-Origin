const validator = (req, res, next) => {
    req.expect = (reqKeys) => {
        const keys = Object.keys(req.body);
        const truthmap = reqKeys.map(v => keys.includes(v));
        truthmap.forEach( (b,i) => {
            if(!b)
                throw new Error(`Expected parameter '${reqKeys[i]}' was not received.`);
        })
    }
    next();
}

module.exports = validator;
