function responseProvider(res){
    //TODO: Only show error if debug mode is enable. Hide error in production.
    const defaultFail = (msg, code=500, error=undefined) => {

        if(typeof(msg) == "object" && msg.sqlMessage){
            error = msg;
            code |= msg.return_code;
            msg = msg.sqlMessage;
        }else if(typeof(msg) == "object"){
            error = {
                name: msg.name,
                message: msg.message,
                file: msg.fileName,
                line: msg.lineNumber,
                col: msg.columnName,
                stack: msg.stack
            }
            code |= msg.return_code;
            msg = msg.message
        }


        res.status(code).json({
            "message": msg,
            error
        });
    };

    const defaultSuccess = data => {
        if(typeof(data) == "object" && data.return_code){
            res.status(data.return_code).json({
                message: "Query success",
                data: data.data
            });
        }else{
            res.json({
                message: "Query success",
                data: data
            });
        }
    };

    return {
        defaultFail, defaultSuccess,
        default: {
            success: defaultSuccess,
            fail: defaultFail
        }};
};

module.exports = responseProvider;
