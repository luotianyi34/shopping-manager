const express = require('express');
const router = express.Router();
const result = require("../util/json")
const connection = require("../util/db");

router.get("/list", function (req, res) {
    res.render("order/order-list.ejs",{loginInfo: req.session.loginInfo});
})

router.get("/page", function (req, res) {
    const {query} = req;
    const {loginInfo} = req.session;
    const params = [];
    let sql = "select o.*,s.`name` sname from `order` o left join  (select shop_id from userinfo group by shop_id) u on o.s_id = u.shop_id left join shop s on u.shop_id = s.id where 1 = 1 ";

    if (loginInfo.power === 2) {
        sql += "and u.shop_id = ? ";
        params.push(loginInfo.shop_id);
    }
    if (query.s_id){
        sql += " and s_id = ?"
        params.push(query.s_id);
    }
    sql += " order by o.id limit ?,? ";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));
    connection.query(sql, params, function (e, dataList) {
        if (e) throw e;
        let countSql = "select count(o.id) count from `order` o left join (select shop_id from userinfo group by shop_id) u on o.s_id =u.shop_id where 1 = 1 ";
        const countParams = [];
        if (loginInfo.power === 2) {
            countSql += "and u.shop_id = ? ";
            countParams.push(loginInfo.shop_id);
        }
        connection.query(countSql, countParams, function (e, r) {
            if (e) throw e;
            res.send(result.page(dataList, r[0].count));
        });
    });
})

router.delete("/delete/:id", function (req, res) {
    connection.query("delete from order where id = ? ", [req.params.id], function (e, r) {
        if (e) throw e;
        res.send(r.affectedRows === 1 ? result.ok() : result.error("删除失败!"))
    });
});

module.exports = router;