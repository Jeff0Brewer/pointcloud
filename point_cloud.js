class PointCloud{
	constructor(p_fpv, c_fpv, radius, num_points){
		this.p_fpv = p_fpv;
		this.c_fpv = c_fpv;

		let color_map = new ColorMap("#810126 0%, #d00c21 18.7%, #cf0f21 18.7%, #dd171e 23.2%, #df161d 23.2%, #df161d 23.5%, #df191d 23.5%, #e61e1e 26.3%, #e6221e 26.5%, #e8241f 27.7%, #e8261e 27.7%, #f13625 32.2%, #f13824 32.2%, #f63f27 34.2%, #f84528 35.6%, #f84727 35.6%, #fc502c 37.9%, #fd6e33 44.1%, #fc6f34 44.1%, #fd7235 44.9%, #fd7434 45.1%, #fd7b37 46.5%, #fc7d37 46.8%, #fd863a 48.8%, #fe8a3c 49.7%, #fd8c3b 49.7%, #fd9440 52.7%, #fc953f 52.7%, #fe953f 53.1%, #fd9641 53.1%, #fd9d43 55.9%, #fc9e45 55.9%, #fea145 57.5%, #fea346 57.5%, #ffa948 60%, #feaa49 60%, #feb04b 62.3%, #fdb24c 62.3%, #fdb24c 62.6%, #ffb14c 62.6%, #ffb14c 63.1%, #feb34d 63.1%, #feb853 64.9%, #fedd7e 77.8%, #fffecb 100%");

		let points = [];
		let colors = [];

		noise.seed(Math.random());
		let scale = 2*1/radius;
		let num_t = 75;
		let d = 2*radius/num_t;
		let space = radius*scale*5;

		for(let i = 0; i < num_points; i++){
			let point = [];
			for(let i = 0; i < this.p_fpv; i++)
				point.push(Math.random()*radius*2 - radius);
			if(magnitude(point) < radius){
				points.push(point);
				colors.push([0,0,0]);
			}
			else{
				i--;
			}
		}

		let max_dist = 0;
		for(let p = 0; p < points.length; p++){
			for(let t = 0; t < num_t; t++){
				let dx = d*noise.perlin3(points[p][0]*scale + space, points[p][1]*scale, points[p][2]*scale);
				let dy = d*noise.perlin3(points[p][0]*scale, points[p][1]*scale + space, points[p][2]*scale);
				let dz = d*noise.perlin3(points[p][0]*scale, points[p][1]*scale, points[p][2]*scale + space);
				points[p][0] += dx;
				points[p][1] += dy;
				points[p][2] += dz;
				colors[p][0] += dx;
				colors[p][1] += dy;
				colors[p][2] += dz;
			}
			max_dist = max(max_dist, magnitude(colors[p]));
		}

		this.pos_buffer = new Float32Array(points.length*this.p_fpv);
		this.col_buffer = new Float32Array(colors.length*this.c_fpv);
		let pos_ind = 0;
		let col_ind = 0;
		for(let i = 0; i < points.length; i++){
			let mapped = color_map.map(magnitude(colors[i]), 0, max_dist);
			let color = [mapped.r, mapped.g, mapped.b];

			for(let j = 0; j < points[i].length; j++, pos_ind++, col_ind++){
				this.pos_buffer[pos_ind] = points[i][j];
				this.col_buffer[col_ind] = color[j];
			}
		}
	}

	init_buffers(){
		this.fsize = this.pos_buffer.BYTES_PER_ELEMENT;

		//position buffer
		this.gl_pos_buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_pos_buf);
		gl.bufferData(gl.ARRAY_BUFFER, this.pos_buffer, gl.STATIC_DRAW);

		this.a_Position = gl.getAttribLocation(gl.program, "a_Position");
		gl.vertexAttribPointer(this.a_Position, this.p_fpv, gl.FLOAT, false, this.fsize * this.p_fpv, 0);
		gl.enableVertexAttribArray(this.a_Position);

		//color buffer
		this.gl_col_buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_col_buf);
		gl.bufferData(gl.ARRAY_BUFFER, this.col_buffer, gl.STATIC_DRAW);

		this.a_Color = gl.getAttribLocation(gl.program, "a_Color");
		gl.vertexAttribPointer(this.a_Color, this.c_fpv, gl.FLOAT, false, this.fsize * this.c_fpv, 0);
		gl.enableVertexAttribArray(this.a_Color);
	}

	draw(u_ModelMatrix){
		//position buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_pos_buf);
		gl.vertexAttribPointer(this.a_Position, this.p_fpv, gl.FLOAT, false, this.fsize * this.p_fpv, 0);

		//color buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_col_buf);
		gl.vertexAttribPointer(this.a_Color, this.c_fpv, gl.FLOAT, false, this.fsize * this.c_fpv, 0);

		//drawing
		gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
		gl.drawArrays(gl.POINTS, 0, this.pos_buffer.length / this.p_fpv);
	}

}