var tianma = require('../lib/application');
var app = tianma(80);

app.use(function *(next){
    if(this.request.url().match(/\.ico$/)) {
        return ;
    }
    yield next;
})
.mount('localhost').then
    .mount('/a').then
        .use(function *(next){
            console.log('localhost/a');
            console.log(this.request.url());
            console.log(this.request.base);
            yield next
        })
        .mount('/b').then
            .use(function *(next){
                console.log('localhost/a/b');
                console.log(this.request.url());
                console.log(this.request.base);
                yield next
            }).end
        .end
    .end
.mount('changelog.alif2e.com').then
    .use(function *(next){
        console.log('changelog.alif2e.com');
    })
    .end


.use(function *(next){
    console.log('...');
    console.log(this.request.url());
    this.response.data('ok')
    yield next;
})
