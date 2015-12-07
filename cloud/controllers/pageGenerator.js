/**
 * Created by sandr on 17.09.15.
 */
exports.renderPage = function  (req, res) {
 
 
    res.render('index', {

        title:"FAnalyze | Главная",
        page:"mainPage"
 
    });
};