const express = require('express');
const router = express.Router();
const connection = require("../util/db")
const result = require("../util/json")

router.get("/list", function (req, res) {
    res.render("userinfo/userinfo-list", {loginInfo: req.session.loginInfo});
})

router.get("/page", function (req, res) {
    const {query} = req;
    const {loginInfo} = req.session;
    let sql = "select u.*,d.name dname from userinfo u left join shop d on u.shop_id = d.id where 1 = 1 ";
    const params = [];
    sql = setSqlParams(query, sql, params, loginInfo);
    sql += " order by u.id desc limit ?,?";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));
    connection.query(sql, params, function (e, userList) {
        if (e) throw e;
        let countSql = "select count(u.id) count from userinfo u left join shop d on u.shop_id = d.id where 1 = 1 ";
        const countParams = [];
        countSql = setSqlParams(query, countSql, countParams, loginInfo);
        connection.query(countSql, countParams, function (e, r) {
            if (e) throw e;
            res.send(result.page(userList, r[0].count));
        });
    });
})

router.delete("/delete/:id", function (req, res) {
    const userId = req.params.id;
    if (userId == 1) {
        res.send(result.error("管理员禁止删除！"));
    } else if (userId == req.session.loginInfo.id) {
        res.send(result.error("当前登录用户禁止删除！"));
    } else {
        connection.query("delete from userinfo where id = ? ", [userId], function (e, r) {
            if (e) throw e;
            res.send(r.affectedRows === 1 ? result.ok() : result.error("删除失败!"))
        });
    }
})

router.get("/edit", function (req, res) {
    const {query} = req;
    if (query.id) {
        connection.query("select u.*,d.name dname from userinfo u left join shop d on u.shop_id = d.id where u.id = ?", [query.id], function (e, r) {
            if (e) throw e;
            res.render("userinfo/userinfo-edit", {userinfo: r[0], loginInfo: req.session.loginInfo, type: query.type});
        });
    } else {
        res.render("userinfo/userinfo-edit", {userinfo: {}, loginInfo: req.session.loginInfo, type: query.type})
    }
})
router.post("/save", function (req, res) {
    const {body} = req;
    connection.query("select * from userinfo where username = ?", [body.username], function (e, r) {
        if (e) throw e;
        if (r.length > 0) {
            res.json(result.error("该用户名已存在！"));
        } else {
            let sql = "INSERT INTO userinfo values (null,?,'666888',?,?,?,?,?,?,?,?,?)"
            const params = [body.username, body.nickname, body.phone, body.shop_id || null, body.power, body.status, body.avatar, body.business_license, req.session.loginInfo.id, new Date()];
            connection.query(sql, params, function (e, r) {
                if (e) throw e;
                if (r.affectedRows === 1) {
                    res.json(result.ok());
                } else {
                    res.json(result.error("添加失败"))
                }
            });
        }
    })
})

router.post("/update", function (req, res) {
    const {body} = req;
    let sql = "update userinfo set nickname = ?, phone = ?, shop_id = ?, power = ?, status = ?,avatar = ?, business_license = ? where id = ?";
    const params = [body.nickname, body.phone, body.shop_id, body.power ? body.power : 1, body.status, body.avatar, body.business_license, body.id];
    connection.query(sql, params, function (e, r) {
        if (e) throw e;
        if (r.affectedRows === 1) {
            res.json(result.ok());
        } else {
            res.json(result.error("修改失败"))
        }
    });
})
router.get('/password', function (req, res) {
    res.render('userinfo/userinfo-password', {username: req.session.loginInfo.username})
})
router.post('/pwd', function (req, res) {
    const {body} = req;
    const userId = req.session.loginInfo.id;
    connection.query("select * from userinfo where id = ? and password = ?", [userId, body.oldPassword], function (e, r) {
        if (e) throw e;
        if (r.length > 0) {
            connection.query("update userinfo set password = ? where id = ?", [body.password, userId], function (e, r) {
                if (e) throw e;
                if (r.affectedRows > 0) {
                    req.session.loginInfo = null;
                    res.json(result.ok())
                } else {
                    res.json(result.error("修改失败"))
                }
            })
        } else {
            res.json(result.error("原密码不正确！"));
        }
    });
})

router.get('/driver/select', function (req, res) {
    connection.query("select * from userinfo where power = 2 order by id desc", function (e, r) {
        if (e) throw e;
        res.json(result.ok(r))
    })
})

router.get('/apply/select', function (req, res) {
    connection.query("select * from userinfo where power in (2,3) order by id desc", function (e, r) {
        if (e) throw e;
        res.json(result.ok(r))
    })
})

function setSqlParams(query, sql, params, loginInfo) {
    if (query.username) {
        sql += " and u.username = ? ";
        params.push(query.username);
    }
    if (query.nickname) {
        sql += "and u.nickname like ? ";
        params.push(`%${query.nickname}%`);
    }
    if (query.phone) {
        sql += "and u.phone = ? ";
        params.push(query.phone);
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
    if (query.power) {
        sql += "and u.power = ? ";
        params.push(query.power);
    }
    if (query.status) {
        sql += "and u.status = ? ";
        params.push(query.status);
    }
    return sql;
}

module.exports = router;
