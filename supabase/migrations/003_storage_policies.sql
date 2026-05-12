-- 允许公开读取访问
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'tattoo-references' );

-- 允许认证用户（或者所有用户，因为是演示项目）上传文件
CREATE POLICY "Public Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'tattoo-references' );

-- 允许公开更新和删除（演示用）
CREATE POLICY "Public Update Access" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'tattoo-references' );

CREATE POLICY "Public Delete Access" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'tattoo-references' );
