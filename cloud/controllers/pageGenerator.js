/**
 * Created by sandr on 17.09.15.
 */
exports.renderPage = function  (req, res) {
 
 
    res.render('main', {
        "someContent":"Hello word"
 
    });
};