const pool = require('../modules/pool');

const ranking = {

  // HAVING 
  //year = current_year AND month = current_month
  //year과 month를 보내줄 필요가 있나? --> 보니까 내가 사용하려고 넣어놓은 것 같긴 한데,,
  //이거 어떻게 수정하면 좋을지 생각해보기
  winner: async () => {

    const query = 
    `SELECT 
      u.nickname, u.image, u.user_idx,
      COUNT(IF(r.result = 1, 1, null) || IF(r.result = 5, 1, null)) as win, 
      COUNT(IF(r.result = 2, 1, null) || IF(r.result = 3, 1, null)) as lose, 
      YEAR(r.created_time) as year,
      MONTH(r.created_time) as month,
      MONTH(NOW()) as current_month,
      YEAR(NOW()) as current_year
    FROM user u 
    LEFT JOIN run r ON u.user_idx = r.user_idx
    GROUP BY 
      u.user_idx
    ORDER BY win DESC, lose ASC
    limit 10
      `;
      
    try {
      return await pool.queryParam(query);
    }
    catch (err) {
      throw(err);
    }
  },

  //HAVING 
  //year = current_year AND month = current_month
  loser: async () => {
    const query = 
    `SELECT 
      u.nickname, u.image, u.user_idx,
      COUNT(IF(r.result = 1, 1, null) || IF(r.result = 5, 1, null)) as win, 
      COUNT(IF(r.result = 2, 1, null) || IF(r.result = 3, 1, null)) as lose, 
      YEAR(r.created_time) as year,
      MONTH(r.created_time) as month,
      MONTH(NOW()) as current_month,
      YEAR(NOW()) as current_year
    FROM 
      user u 
    LEFT JOIN run r ON u.user_idx = r.user_idx
    GROUP BY 
      u.user_idx
    ORDER BY lose DESC, win ASC
    limit 10
    `;
    return await pool.queryParam(query);
  },

  runner: async () => {
    //year = current_year을 사용하고 groupby로 묶어서
    //7월이 아닌 달에 달린 사람들은 안묶음.
    //AND year = current_year AND month = current_month
    const query = 
    `
    SELECT 
      u.nickname, u.image, u.user_idx,
      SUM(r.distance) as sum,
      SUM(r.time) as sum_time,
      SUBSTR(r.created_time, 1, 4) as year, 
      MONTH(r.created_time) as month,
      MONTH(NOW()) as current_month,
      YEAR(NOW()) as current_year
    FROM 
     user u 
    LEFT JOIN run r ON u.user_idx = r.user_idx
    GROUP BY 
      u.user_idx
    HAVING sum IS NOT NULL 
    ORDER BY sum DESC, sum_time ASC
    limit 10
    `;
    
    return await pool.queryParam(query);
  },

  getDetailProfile: async(id) => {
    const query = 
    `
    SELECT u.nickname, u.image, u.level,
    COUNT(IF(r.result = 1, 1, null) || IF(r.result = 5, 1, null)) as win,
    COUNT(IF(r.result = 2, 1, null) || IF(r.result = 3, 1, null)) as lose
    FROM user u 
    LEFT JOIN run r ON u.user_idx = r.user_idx
    WHERE u.user_idx = "${id}"
    `;
    const data = await pool.queryParam(query);

    return data[0];
  }
};

module.exports = ranking;