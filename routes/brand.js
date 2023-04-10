const express = require('express');
const router = express.Router();
const connection = require("../util/db")
const result = require("../util/json")

router.get("/list", function (req, res) {
    res.render("brand/brand-list");
})

router.get("/page", function (req, res) {
    const {query} = req;
    const params = [];
    let sql = "select * from brand where 1 = 1 ";
    if (query.brand_name) {
        sql += "and brand_name = ? ";
        params.push(query.brand_name);
    }
    if (query.status) {
        sql += "and status = ? ";
        params.push(query.status);
    }
    sql += " order by id desc limit ?,?";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));
    connection.query(sql, params, function (e, dList) {
        if (e) throw e;
        let countSql = "select count(*) count from brand where 1 = 1 ";
        const countParams = [];
        if (query.brand_name) {
            countSql += "and brand_name = ? ";
            countParams.push(query.brand_name);
        }
        if (query.status) {
            countSql += "and status = ? ";
            countParams.push(query.status);
        }
        connection.query(countSql, countParams, function (e, r) {
            if (e) throw e;
            res.send(result.page(dList, r[0].count));
        });
    });
})

router.delete("/delete/:id", function (req, res) {
    connection.query("select * from car where brand_id = ?", req.params.id, function (e, r) {
        if (e) throw e;
        if (r.length > 0) {
            res.json(result.error("该品牌已被使用，禁止删除"))
        } else {
            connection.query("delete from brand where id = ?", [req.params.id], function (e, r) {
                if (e) throw e;
                if (r.affectedRows === 1) {
                    res.send(result.ok());
                } else {
                    res.send(result.error("删除失败"));
                }
            })
        }
    })


});
router.get("/edit", function (req, res) {
    const {query} = req;
    if (query.id) {
        connection.query("select * from brand where id = ?", query.id, function (e, r) {
            if (e) throw e;
            res.render("brand/brand-edit", {brand: r[0]})
        })
    } else {
        res.render("brand/brand-edit", {brand: {}})
    }
})

router.post("/update", function (req, res) {
    const {body} = req;
    if (body.id) {
        let sql = "update brand set brand_name = ?,profile = ?,status = ? where id = ?";
        const params = [body.brand_name, body.profile, body.status, body.id];
        connection.query(sql, params, function (e, r) {
            if (e) throw e;
            if (r.affectedRows === 1) {
                res.send(result.ok());
            } else {
                res.send(result.error("修改失败"));
            }
        });
    } else {
        let sql = "insert into brand values(null,?,?,?)";
        const params = [body.brand_name, body.profile, body.status];
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
    let sql = "select * from brand ";
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
