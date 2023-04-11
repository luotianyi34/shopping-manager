const express = require('express');
const router = express.Router();
const connection = require("../util/db")
const result = require("../util/json")

router.get("/list",function (req,res) {
    res.render("shop/shop-list",{loginInfo: req.session.loginInfo});
})
router.get("/page",function (req, res) {
    const {query} = req;
    const {loginInfo} = req.session;
    const params = [];
    let sql = "select s.* from shop s left join (select shop_id from userinfo group by shop_id) u on s.id =u.shop_id where 1 = 1 ";
    if(query.name){
        countSql += "and name = ? ";
        countParams.push(query.name);
    }
    if(query.status){
        countSql+= "and status = ? ";
        countParams.push(query.status);
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
    sql += " order by s.id limit ?,?";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));
    connection.query(sql, params, function (e, shopList) {
        if (e) throw e;
        let countSql = "select count(s.id) count from shop s left join userinfo u on u.shop_id = s.id ";
        const countParams = [];
        if(query.name){
            countSql += "and name = ? ";
            countParams.push(query.name);
        }
        if(query.status){
            countSql+= "and status = ? ";
            countParams.push(query.status);
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

router.delete("/delete/:id", function (req, res) {
    connection.query("select * from userinfo where shop_id = ?", req.params.id, function (e, r) {
        if (e) throw e;
        if (r.length > 0) {
            res.json(result.error("该部门已被使用，禁止删除！"));
        } else {
            connection.query("delete from shop where id = ?", [req.params.id], function (e, r) {
                if (e) throw e;
                if (r.affectedRows === 1) {
                    res.json(result.ok());
                } else {
                    res.json(result.error("删除失败"));
                }
            })
        }
    })
});
router.get("/edit", function (req, res) {
    const {query} = req;
    if (query.id) {
        connection.query("select * from shop where id = ?", query.id, function (e, r) {
            if (e) throw e;
            res.render("shop/shop-edit", {shop: r[0]})
        })
    } else {
        res.render("shop/shop-edit", {shop: {}})
    }
})

router.post("/update", function (req, res) {
    const {body} = req;
    if (body.id) {
        let sql = "update shop set name = ?,profile = ?,status = ? where id = ?";
        const params = [body.name, body.profile, body.status, body.id];
        connection.query(sql, params, function (e, r) {
            if (e) throw e;
            if (r.affectedRows === 1) {
                res.send(result.ok());
            } else {
                res.send(result.error("修改失败"));
            }
        });
    } else {
        let sql = "insert into shop values(null,?,?,?)";
        const params = [body.name, body.profile, body.status];
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
    let sql = "select * from shop where 1 = 1 ";
    const params = [];
    if (query.status) {
        sql += "where status = ? ";
        params.push(query.status)
    }
    sql += "order by id desc";
    connection.query(sql, params, function (e, dList) {
        if (e) throw e;
        res.send(result.ok(dList));
    });
})

module.exports = router;
