from django.db import models

class Job(models.Model):
    id = models.CharField(primary_key=True, max_length=191)
    title = models.CharField(max_length=191)
    slug = models.CharField(unique=True, max_length=191)
    description = models.TextField()
    benefits = models.TextField(blank=True, null=True)
    requirements = models.TextField(blank=True, null=True)
    quantity = models.IntegerField()
    salarymin = models.IntegerField(db_column='salaryMin', blank=True, null=True)
    salarymax = models.IntegerField(db_column='salaryMax', blank=True, null=True)
    wardid = models.CharField(db_column='wardId', max_length=191, blank=True, null=True)
    addressdetail = models.CharField(db_column='addressDetail', max_length=191, blank=True, null=True)
    type = models.CharField(max_length=50)
    experience = models.CharField(max_length=50, blank=True, null=True)
    level = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=50)
    rejectreason = models.TextField(db_column='rejectReason', blank=True, null=True)
    deadline = models.DateTimeField(blank=True, null=True)
    categoryid = models.CharField(db_column='categoryId', max_length=191)
    companyid = models.CharField(db_column='companyId', max_length=191)
    createdat = models.DateTimeField(db_column='createdAt')
    updatedat = models.DateTimeField(db_column='updatedAt')
    isvisible = models.BooleanField(db_column='isVisible', default=True)

    class Meta:
        managed = False
        db_table = 'jobs'

    def __str__(self):
        return self.title

class Resume(models.Model):
    id = models.CharField(primary_key=True, max_length=191)
    userid = models.CharField(db_column='userId', max_length=191)
    title = models.CharField(max_length=191)
    address = models.CharField(max_length=191, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    socicallink = models.JSONField(blank=True, null=True)
    education = models.JSONField(blank=True, null=True)
    experience = models.JSONField(blank=True, null=True)
    projects = models.JSONField(blank=True, null=True)
    degree = models.CharField(max_length=191, blank=True, null=True)
    languages = models.CharField(max_length=191, blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt')
    updatedat = models.DateTimeField(db_column='updatedAt')
    templateid = models.CharField(db_column='templateId', max_length=191, blank=True, null=True)
    avatarurl = models.CharField(db_column='avatarUrl', max_length=191, blank=True, null=True)
    cvdata = models.JSONField(db_column='cvData', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'resumes'

    def __str__(self):
        return self.title

class Application(models.Model):
    id = models.CharField(primary_key=True, max_length=191)
    userid = models.CharField(db_column='userId', max_length=191)
    jobid = models.CharField(db_column='jobId', max_length=191)
    cvurl = models.CharField(db_column='cvUrl', max_length=255, blank=True, null=True)
    resumeid = models.CharField(db_column='resumeId', max_length=191, blank=True, null=True)
    status = models.CharField(max_length=50)
    matchscore = models.IntegerField(db_column='matchScore', blank=True, null=True)
    coverletter = models.TextField(db_column='coverLetter', blank=True, null=True)
    createdat = models.DateTimeField(db_column='createdAt')
    updatedat = models.DateTimeField(db_column='updatedAt')

    class Meta:
        managed = False
        db_table = 'applications'


