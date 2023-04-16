const express = require('express');
const router = express.Router();
const conn = require("../util/db")
const result = require("../util/json")
const connection = require("../util/db");

/*跳转登录页*/
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get("/home",function (req,res) {
  res.render("home/home",{loginInfo:req.session.loginInfo})
})
router.get("/welcome",function (req, res) {
  res.render("home/welcome", {loginInfo: req.session.loginInfo})
})

router.post("/login",function (req, res) {
  const {body} = req;
  let sql = "select * from userinfo where username = ? and password = ?";
  conn.query(sql,[body.username,body.password],function (e,r) {
    if(e) throw e;
    if(r.length === 1){
      const user = r[0];
      if(user.status === 1){
        req.session.loginInfo = user;
        res.json(result.ok(user));
      } else {
        res.json(result.error("该用户已被封禁"));
      }
    } else {
      res.json(result.error("用户名或密码不正确"));
    }
  })
})
router.post('/logout', function (req, res) {
  req.session.loginInfo = null;
  res.json(result.ok());
})

router.get('/nologin', function (req, res) {
  res.render("nologin");
})

router.get('/count',function (req, res){
  const {loginInfo} = req.session;
  if (loginInfo.power == 1) {
    connection.query("select count(*) count from userinfo ",function (e,userinfo){
      if (e) throw e ;
      conn.query("select count(*) count from client ",function (e,client){
        if (e) throw e ;
        conn.query("select count(*) count from shop ",function (e,shop){
          if (e) throw e ;
        res.json(result.ok({
          userCount: userinfo[0].count,
          clientCount: client[0].count,
          shopCount:shop[0].count,
          }));
        })
       })
      })
  }else if (loginInfo.power == 2) {
    conn.query("select count(*) count from item i left join (select shop_id from userinfo group by shop_id) u on i.s_id = u.shop_id where u.shop_id = ?", loginInfo.shop_id, function (e, item) {
      if (e) throw e ;
      conn.query("select count(o.s_id) count from `order` o left join (select shop_id from userinfo group by shop_id) u on o.s_id = u.shop_id where u.shop_id = ?", loginInfo.shop_id, function (e, order) {
        if (e) throw e ;
      res.json(result.ok({
        itemCount:item[0].count,
        orderCount:order[0].count,
      }));
    })
  })
  }
})
// router.get('/count', function (req, res) {
//   const {loginInfo} = req.session;
//   if (loginInfo.power == 1) {
//     conn.query("select count(*) count from userinfo", function (e, user) {
//       if (e) throw e;
//       conn.query("select count(*) count from car", function (e, car) {
//         if (e) throw e;
//         conn.query("select count(*) count from applyinfo where exam_status = 20", function (e, apply20) {
//           if (e) throw e;
//           conn.query("select count(*) count from applyinfo", function (e, apply) {
//             if (e) throw e;
//             res.json(result.ok({
//               userCount: user[0].count,
//               carCount: car[0].count,
//               apply20Count: apply20[0].count,
//               applyCount: apply[0].count
//             }));
//           })
//         })
//       })
//     });
//   } else if (loginInfo.power == 2) {
//     conn.query("select count(u.id) count from userinfo u left join department d on u.department_id = d.id where u.department_id = ?", loginInfo.department_id, function (e, user) {
//       if (e) throw e;
//       conn.query("select count(*) count from applyinfo where apply_id = ?", loginInfo.id, function (e, myApply) {
//         if (e) throw e;
//         conn.query("select count(a.id) count from applyinfo a left join userinfo u on a.apply_id = u.id left join department d on u.department_id = d.id where u.department_id = ? and a.exam_status = 10", loginInfo.department_id, function (e, examApply) {
//           if (e) throw e;
//           conn.query("select count(a.id) count from applyinfo a left join userinfo u on a.apply_id = u.id left join department d on u.department_id = d.id where u.department_id = ?", loginInfo.department_id, function (e, apply) {
//             res.json(result.ok({
//               userCount: user[0].count,
//               myApplyCount: myApply[0].count,
//               examApplyCount: examApply[0].count,
//               applyCount: apply[0].count
//             }));
//           })
//         })
//       })
//     });
//   } else if (loginInfo.power == 3) {
//     conn.query("select count(*) count from applyinfo where apply_id = ? and exam_status = 10", loginInfo.id, function (e, myApply) {
//       conn.query("select count(*) count from applyinfo where apply_id = ? and exam_status in (20,21)", loginInfo.id, function (e, depApply) {
//         conn.query("select count(*) count from applyinfo where exam_status in (30,31,40) and apply_id = ?", loginInfo.id, function (e, adminApply) {
//           conn.query("select count(*) count from applyinfo where apply_id = ?", loginInfo.id, function (e, apply) {
//             res.json(result.ok({
//               myApplyCount: myApply[0].count,
//               depApplyCount: depApply[0].count,
//               adminCount: adminApply[0].count,
//               applyCount: apply[0].count
//             }));
//           })
//         })
//       })
//     })
//   } else {
//     res.json(result.ok());
//   }
// })
module.exports = router;
