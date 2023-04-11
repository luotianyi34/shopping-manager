const express = require('express');
const router = express.Router();
const result = require("../util/json")
const connection = require("../util/db");

router.get("/list", function (req, res) {
    res.render("item/item-list",{loginInfo: req.session.loginInfo});
})

router.get("/page",function (req, res) {
    const {query} = req;
    const {loginInfo} = req.session;
    const params = [];
    let sql = "select i.* from item i left join (select shop_id from userinfo group by shop_id) u on i.s_id =u.shop_id where 1 = 1 ";

    if (loginInfo.power === 2) {
        sql += "and u.shop_id = ? ";
        params.push(loginInfo.shop_id);
    } else {
        if (query.shop_id) {
            sql += "and u.shop_id = ? ";
            params.push(query.shop_id);
        }
    }
    sql += " order by i.s_id limit ?,?";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));
    connection.query(sql, params, function (e, shopList) {
        if (e) throw e;
        let countSql = "select count(i.id) count from item i left join userinfo u on u.shop_id = i.s_id ";
        const countParams = [];
        if(query.name){
            countSql += "and name = ? ";
            countParams.push(query.name);
        }
        if (loginInfo.power === 2) {
            sql += "and u.shop_id = ? ";
            params.push(loginInfo.shop_id);
        } else {
            if (query.shop_id) {
                sql += "and u.shop_id = ? ";
                params.push(query.shop_id);
            }
        }
        connection.query(countSql, countParams, function (e, r) {
            if (e) throw e;
            res.send(result.page(shopList, r[0].count));
        });
    });
})

router.get("/edit", function (req, res) {
    const {query} = req;
    if (query.id) {
        connection.query("select i.*,s.name sname from item i left join shop s on i.s_id = s.id where i.id = ?", [query.id], function (e, r) {
            if (e) throw e;
            res.render("item/item-edit", {item: r[0], loginInfo: req.session.loginInfo, type: query.type})
        })
    } else {
        res.render("item/item-edit", {item: {}, loginInfo: req.session.loginInfo, type: query.type})
    }
})

router.get("/select", function (req, res) {
    const {query} = req;
    let sql = "select * from item where 1 = 1 ";
    const params = [];
    sql += "order by id";
    connection.query(sql, params, function (e, itemList) {
        if (e) throw e;
        res.send(result.ok(itemList));
    });
})
router.post("/update", function (req, res) {
    const {body} = req;
        let sql = "update item set name = ?,price = ?,stock=?,profile = ?,picture=? where id = ?";
        const params = [body.name, body.price, body.stock,body.profile,body.picture,body.id];
        connection.query(sql, params, function (e, r) {
            if (e) throw e;
            if (r.affectedRows === 1) {
                res.send(result.ok());
            } else {
                res.send(result.error("修改失败"));
            }
        });
})
router.post("/save", function (req, res) {
    let sql = "INSERT INTO item values (null,?,?,?,?,?,?,?,?)"
    const params = [body.name, body.price, body.stock, body.s_id || null, body.profile, body.picture,  req.session.loginInfo.id, new Date()];
    connection.query(sql, params, function (e, r) {
        if (e) throw e;
        if (r.affectedRows === 1) {
            res.json(result.ok());
        } else {
            res.json(result.error("添加失败"))
        }
    });
})
module.exports=router;