/**
 * This will not work on older browsers
 **/
function createElement(template, data){
    const parent_div = document.createElement("div");
    parent_div.innerHTML = template(data);
    return parent_div.firstElementChild;
}

function getParam(param){
    const url = new URL(window.location);
    return url.searchParams.get(param);
}

const headers = {
    "Content-Type": "application/json"
};

const SNOAPI = {
    getCategories: (callback) => {
        fetch("/api/category", {
            "method": "GET",
            headers
        }).then(r=>r.json())
            .then(callback)
         .catch(err => {
             console.error(err);
         });

    },
    getProducts: (callback,opts={}) => {
        const options = "?"+new URLSearchParams({populate: true, ...opts}).toString();
        fetch("/api/product"+options, {
            "method": "GET",
            headers
        }).then(r=>r.json())
            .then(callback)
            .catch(err=> {
                console.error(err);
            });
    },
    populateContainer: (container, template) => response => {
            container.innerHTML = ""; //clear container first
            response.data.map( data => {
                const el = createElement(template, data);
                container.appendChild(el);
            })
    }
}
