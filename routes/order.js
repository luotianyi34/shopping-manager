const express = require('express');
const router = express.Router();
const result = require("../util/json")
const connection = require("../util/db");

router.get("/list", function (req, res) {
    res.render("order/order-list",{loginInfo: req.session.loginInfo});
})

router.get("/page", function (req, res) {
    const {query} = req;
    const {loginInfo} = req.session;
    const params = [];
    let sql = "select o.*,s.`name` sname from `order` o left join  (select shop_id from userinfo group by shop_id) u on o.s_id = u.shop_id left join shop s on u.shop_id = s.id where 1 = 1 ";
    if(query.controller){
        sql+= "and controller = ? ";
        params.push(query.controller);
    }
    if(query.way){
        sql+= "and way = ? ";
        params.push(query.way);
    }
    if (query.post) {
        sql += "and post = ? ";
        params.push(query.post)
    }
    if (loginInfo.power === 2) {
        sql += "and u.shop_id = ? ";
        params.push(loginInfo.shop_id);
    }
    sql += " order by o.id limit ?,? ";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));
    connection.query(sql, params, function (e, dataList) {
        if (e) throw e;
        let countSql = "select count(o.id) count from `order` o left join (select shop_id from userinfo group by shop_id) u on o.s_id =u.shop_id where 1 = 1 ";
        const countParams = [];
        if(query.way){
            countSql+= "and way = ? ";
            countParams.push(query.way);
        }
        if(query.controller){
            countSql+= "and controller = ? ";
            countParams.push(query.controller);
        }
        if (query.post) {
            countSql += "and post = ? ";
            countParams.push(query.post)
        }
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

router.get("/edit", function (req, res) {
    const {query} = req;
    if (query.id) {
        connection.query("select o.* from `order` o left join (select shop_id from userinfo group by shop_id) u on o.s_id =u.shop_id where o.id = ? ", [query.id], function (e, r) {
            if (e) throw e;
            res.render("order/order-edit", {order: r[0], loginInfo: req.session.loginInfo, type: query.type})
        })
    } else {
        res.render("order/order-edit", {order: {}, loginInfo: req.session.loginInfo, type: query.type})
    }
})

router.post("/update", function (req, res) {
    const {body} = req;
    const {loginInfo} = req.session;
    if (body.id) {
        let sql = "update `order` set order_name = ?, s_id = ?,total = ?,way=?,post=?,controller=?,order_flush_time=? where id = ?";
        const params = [body.order_name,loginInfo.shop_id, body.total,body.way, body.post,body.controller, new Date(),body.id];
        connection.query(sql, params, function (e, r) {
            if (e) throw e;
            if (r.affectedRows === 1) {
                res.send(result.ok());
            } else {
                res.send(result.error("修改失败"));
            }
        });
    } else {
        let sql = "insert into `order` values(null,?,?,?,?,?,?,?,?) ";
        const params = [body.order_name, loginInfo.shop_id, body.total,new Date(),body.way,body.post,body.controller,new Date()];
        connection.query(sql, params, function (e, r) {
            if (e) throw e;
            if (r.affectedRows === 1) {
                res.send(result.ok());
            } else {
                res.send(result.error("添加失败"));
            }
        });
    }
})

router.get("/select", function (req, res) {
    const {query} = req;
    let sql = "select * from order where 1 = 1 ";
    const params = [];
    if(query.way){
        sql+= "and way = ? ";
        params.push(query.way);
    }
    if(query.controller){
        sql+= "and controller = ? ";
        params.push(query.controller);
    }
    if (query.post) {
        sql += "and post = ? ";
        params.push(query.post)
    }
    sql += "order by id";
    connection.query(sql, params, function (e, itemList) {
        if (e) throw e;
        res.send(result.ok(itemList));
    });
})

router.delete("/delete/:id", function (req, res) {
    connection.query("delete from `order` where id = ? ", [req.params.id], function (e, r) {
        if (e) throw e;
        res.send(r.affectedRows === 1 ? result.ok() : result.error("删除失败!"))
    });
});

module.exports = router;